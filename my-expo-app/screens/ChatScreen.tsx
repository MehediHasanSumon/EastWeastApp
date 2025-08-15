import { useActionSheet } from '@expo/react-native-action-sheet';
import { Entypo, FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import api, { API_BASE_URL } from '../utils/api';
import { getRefreshToken } from '../utils/authStorage';
import { useAppSelector } from '../store';

import BackButton from '../components/BackButton';
import ForwardSelectContact from '../components/ForwardSelectContact'; // Assuming this is your contact select modal
import InputArea from '../components/InputArea';
import MessageActionsModal from '../components/MessageActionsModal';

import { Attachment, Contact, Message, RootStackParamList } from '../types/types';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const ChatScreen = ({ navigation, route }: ChatScreenProps) => {
  const { contactId, contactName } = route.params;
  const authUser = useAppSelector((s) => s.auth.user);
  const currentUserId: string = (authUser as any)?._id || (authUser as any)?.id || '';
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]); // newest-first
  const socketRef = useRef<Socket | null>(null);

  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Modal states
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isForwardModalVisible, setForwardModalVisible] = useState(false);

  const { showActionSheetWithOptions } = useActionSheet();
  const flatListRef = useRef<FlatList>(null);
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    const out: Message[] = [];
    for (const m of messages) {
      if (m?.id && !seen.has(m.id)) {
        seen.add(m.id);
        out.push(m);
      }
    }
    return out;
  }, [messages]);

  // Load current contact and bootstrap conversation
  useEffect(() => {
    const contact: Contact = {
      id: contactId,
      name: contactName,
      lastMessage: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      online: false,
      avatarText: contactName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    };
    setCurrentContact(contact);

    let cancelled = false;
    const init = async () => {
      try {
        // Create or return existing direct conversation
        const convRes = await api.post<{ success: boolean; data: any }>(
          '/api/chat/conversations',
          { participants: [contactId], type: 'direct' }
        );
        if (cancelled) return;
        const conv = convRes.data?.data;
        const convId = conv?._id as string;
        setConversationId(convId);

        // Fetch latest messages
        await loadMessages(convId);

        // Connect socket and join rooms
        await connectSocket();

        try { socketRef.current?.emit('mark_as_read', { conversationId: convId }); } catch {}
      } catch {}
    };
    init();

    return () => {
      cancelled = true;
      try { socketRef.current?.disconnect(); } catch {}
    };
  }, [contactId, contactName]);

  const onSpeechResults = (e: any) => setMessage(e.value[0]);

  const handleAudioCall = () => {
    navigation.navigate('CallScreen', {
      type: 'audio',
      contactName: currentContact?.name || contactName,
      contactId: currentContact?.id || contactId,
    });
  };

  const handleVideoCall = () => {
    navigation.navigate('CallScreen', {
      type: 'video',
      contactName: currentContact?.name || contactName,
      contactId: currentContact?.id || contactId,
    });
  };

  const showMoreOptions = () => {
    const options = ['View Profile', 'Mute Notifications', 'Clear Chat', 'Block Contact', 'Cancel'];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 4,
        destructiveButtonIndex: 3,
      },
      (selectedIndex) => {
        switch (selectedIndex) {
          case 0:
            navigation.navigate('ContactDetails', {
              contactName: currentContact?.name || contactName,
              contactId: currentContact?.id || contactId,
            });
            break;
          case 1:
            Alert.alert(
              'Notifications Muted',
              `You won't receive notifications from ${currentContact?.name || contactName}`
            );
            break;
          case 2:
            Alert.alert('Clear Chat', 'All messages will be deleted', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                onPress: () => setMessages([]),
              },
            ]);
            break;
          case 3:
            Alert.alert('Block Contact', `Block ${currentContact?.name || contactName}?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Block', onPress: () => navigation.goBack() },
            ]);
            break;
        }
      }
    );
  };

  // Helper to add a message locally with de-duplication by id
  const addLocalMessage = (newMsg: Message) => {
    setMessages((prev: Message[]) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [newMsg, ...prev];
    });
  };

  const sendMessage = () => {
    const content = message.trim();
    if (!conversationId) return;
    try {
      if (attachments.length > 0) {
        const att = attachments[0];
        const mime = att.type === 'image' ? 'image/jpeg' : att.type === 'audio' ? 'audio/m4a' : 'application/octet-stream';
        uploadAndSendMedia(att.uri, att.name, mime).finally(() => setAttachments([]));
      }
      if (content) {
        socketRef.current?.emit('send_message', { conversationId, content }, (ack: any) => {
          if (ack?.success && ack.message) {
            const id = (ack.message as any)._id;
            if (!seenMessageIdsRef.current.has(id)) {
              seenMessageIdsRef.current.add(id);
              const mapped = mapServerMessageToUI(ack.message);
              setMessages((prev: Message[]) => (prev.some((m) => m.id === id) ? prev : [mapped, ...prev]));
            }
          }
        });
        setMessage('');
      }
    } catch {}
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttachments([{ id: Date.now().toString(), uri: asset.uri, name: asset.fileName || 'image.jpg', type: 'image' }]);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttachments([{ id: Date.now().toString(), uri: asset.uri, name: asset.fileName || 'photo.jpg', type: 'image' }]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      setAttachments([{ id: Date.now().toString(), uri: file.uri, name: file.name || 'file', type: 'document' }]);
    }
  };

  const uploadAndSendMedia = async (uri: string, name: string, type: string) => {
    if (!conversationId) return;
    try {
      setIsUploading(true);
      const form = new FormData();
      form.append('file', { uri, name, type } as any);
      const res = await api.post('/api/chat/media', form);
      const data = res.data?.data as { url: string; fileName: string; fileSize: number; messageType: 'image' | 'file' | 'voice' };
      socketRef.current?.emit(
        'send_message',
        {
          conversationId,
          content: '',
          messageType: data.messageType,
          mediaUrl: data.url,
          fileName: data.fileName,
          fileSize: data.fileSize,
        },
        (ack: any) => {
          if (ack?.success && ack.message) {
            const id = (ack.message as any)._id;
            if (!seenMessageIdsRef.current.has(id)) {
              seenMessageIdsRef.current.add(id);
              const mapped = mapServerMessageToUI(ack.message);
              setMessages((prev: Message[]) => (prev.some((m) => m.id === id) ? prev : [mapped, ...prev]));
            }
          }
        }
      );
    } finally {
      setIsUploading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await api.get(`/api/chat/conversations/${convId}/messages?page=1&limit=50`);
      const items = Array.isArray(res.data?.data) ? res.data.data : [];
      const mapped: Message[] = items
        .map((m: any) => mapServerMessageToUI(m))
        .reverse(); // newest-first for inverted list
      // De-duplicate and seed seen ids
      const unique: Message[] = [];
      const seen = new Set<string>();
      for (const msg of mapped) {
        if (!seen.has(msg.id)) {
          unique.push(msg);
          seen.add(msg.id);
        }
      }
      seenMessageIdsRef.current = seen;
      setMessages(unique);
    } catch {
      setMessages([]);
    }
  };

  const mapServerMessageToUI = (m: any): Message => {
    const isImage = m.messageType === 'image';
    const isFile = m.messageType === 'file' || m.messageType === 'voice' || m.messageType === 'video';
    const title = m.messageType === 'text' ? m.content : isImage ? '[Image]' : m.fileName ? `[File] ${m.fileName}` : 'Attachment';
    return {
      id: m._id,
      text: title,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSent: (m.sender?._id || m.sender?.id) === currentUserId,
      image: isImage ? m.mediaUrl : undefined,
      file: isFile ? (m.mediaUrl || m.fileName || '') : undefined,
      contactId,
    };
  };

  const connectSocket = async () => {
    if (socketRef.current?.connected) return;
    const token = await getRefreshToken();
    const s = io(API_BASE_URL, {
      auth: { token: token || undefined },
      transports: ['polling', 'websocket'],
      reconnection: true,
    });
    socketRef.current = s;
    s.on('new_message', (pm: any) => {
      if (pm?.conversationId !== conversationId) return;
      const id = pm?._id;
      if (!id || seenMessageIdsRef.current.has(id)) return;
      seenMessageIdsRef.current.add(id);
      addLocalMessage(mapServerMessageToUI(pm));
    });
  };

  const startRecording = async () => {
    try {
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
        recordingRef.current = null;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({
        android: { extension: '.m4a', outputFormat: 2, audioEncoder: 3, sampleRate: 44100, numberOfChannels: 2, bitRate: 128000 },
        ios: { extension: '.caf', audioQuality: 3, sampleRate: 44100, numberOfChannels: 2, bitRate: 128000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
        web: {},
      } as any);
      await rec.startAsync();
      recordingRef.current = rec;
      setIsRecording(true);
    } catch {
      Alert.alert('Error', 'Could not start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      if (uri) {
        setAttachments([{ id: Date.now().toString(), uri, name: `audio_${Date.now()}.m4a`, type: 'audio' }]);
      }
    } catch {
    } finally {
      setIsRecording(false);
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
        recordingRef.current = null;
      }
    }
  };

  // Message Action Modal Handlers
  const handleCopy = () => {
    // Copy is disabled to avoid native module dependency in Expo Go
    setModalVisible(false);
  };

  const handleForward = () => {
    setModalVisible(false);
    setForwardModalVisible(true);
  };

  const handleDelete = () => {
    if (selectedMessage) {
      setMessages((prev: Message[]) => prev.filter((m) => m.id !== selectedMessage.id));
      setModalVisible(false);
    }
  };

  // Forward contact selected from modal
  const handleSelectForwardContact = (forwardContact: Contact) => {
    if (!selectedMessage) return;

    const forwardedMsg: Message = {
      ...selectedMessage,
      id: Date.now().toString(),
      contactId: forwardContact.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSent: true,
    };

    // Local only for now
    setMessages((prev) => [forwardedMsg, ...prev]);
    setForwardModalVisible(false);
    Alert.alert('Message forwarded', `Forwarded to ${forwardContact.name}`);
  };

  // Messages state already holds current contact's messages

  const renderMessage = ({ item }: { item: Message }) => (
    <TouchableOpacity
      onLongPress={() => {
        setSelectedMessage(item);
        setModalVisible(true);
      }}>
      <View
        className={`mb-4 max-w-[80%] rounded-2xl p-3 ${
          item.isSent ? 'self-end rounded-tr-sm bg-blue-600' : 'self-start rounded-tl-sm bg-white'
        }`}>
        {item.image && (
          <TouchableOpacity
            onPress={() => navigation.navigate('ImageViewer', { uri: item.image! })}>
            <Image source={{ uri: item.image }} className="mb-2 h-52 w-52 rounded-lg" />
          </TouchableOpacity>
        )}
        {item.file && (
          <TouchableOpacity>
            <Text className={item.isSent ? 'text-white' : 'text-gray-800'}>📄 {item.text}</Text>
          </TouchableOpacity>
        )}
        <Text className={item.isSent ? 'text-white' : 'text-gray-800'}>
          {!item.image && !item.file ? item.text : ''}
        </Text>
        <Text
          className={`mt-1 text-right text-[11px] ${
            item.isSent ? 'text-white/80' : 'text-gray-500'
          }`}>
          {item.time}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!currentContact) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1877f2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="mb-2 mt-12 flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
        <View className="flex-1 flex-row items-center">
          <View className="color-blue-500">
            <BackButton />
          </View>
          <View className="flex-row items-center space-x-3">
            <View className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-blue-600">
              <Text className="font-bold text-white">{currentContact.avatarText}</Text>
            </View>
            <View>
              <Text className="text-base font-bold">{currentContact.name}</Text>
              <Text className="text-sm text-gray-500">
                {currentContact.online ? 'Online' : 'Offline'}
                {isRecording && ' • Recording...'}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row space-x-4">
          <TouchableOpacity className="mr-5" onPress={handleAudioCall}>
            <FontAwesome name="phone" size={20} color="#1877f2" />
          </TouchableOpacity>
          <TouchableOpacity className="mr-5" onPress={handleVideoCall}>
            <FontAwesome name="video-camera" size={20} color="#1877f2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={showMoreOptions}>
            <Entypo name="dots-three-vertical" size={20} color="#1877f2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={uniqueMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        className="flex-1 bg-gray-100"
        contentContainerClassName="p-5"
        inverted
      />

      {/* Input Area Component */}
      <InputArea
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
        pickImage={pickImage}
        takePhoto={takePhoto}
        pickDocument={pickDocument}
        isUploading={isUploading}
        attachments={attachments}
        setAttachments={setAttachments}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
      />

      {/* Message Actions Modal */}
      <MessageActionsModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        selectedMessage={selectedMessage}
        onCopy={handleCopy}
        onForward={handleForward}
        onDelete={handleDelete}
      />

      {/* Forward Select Contact Modal */}
      {isForwardModalVisible && (
        <ForwardSelectContact
          onSelectContact={handleSelectForwardContact}
          onClose={() => setForwardModalVisible(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default ChatScreen;
