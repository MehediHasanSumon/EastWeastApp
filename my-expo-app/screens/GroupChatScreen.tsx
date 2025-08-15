import { Entypo, FontAwesome } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import BackButton from 'components/BackButton';
import GroupInfoPanel from '../components/GroupInfoPanel';
import InputArea from '../components/InputArea';
import MessageActionsModal from '../components/MessageActionsModal';
import MessageList from '../components/MessageList';
import { Attachment, Group, Message, RootStackParamList } from '../types/types';
import api, { API_BASE_URL } from '../utils/api';
import { useAppSelector } from '../store';
import { getRefreshToken } from '../utils/authStorage';
import { io, Socket } from 'socket.io-client';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupChat'>;

const recordingOptions: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: 2, // MediaRecorder.OutputFormat.MPEG_4 (2)
    audioEncoder: 3, // MediaRecorder.AudioEncoder.AAC (3)
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.caf',
    audioQuality: 3, // AVAudioQualityHigh (3)
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

const GroupChatScreen = ({ navigation, route }: Props) => {
  const { group: routeGroup } = route.params;

  const [group, setGroup] = useState<Group>(routeGroup);
  const conversationId = group.id; // In Messages screen we passed conversation _id as group.id
  const authUser = useAppSelector((s) => s.auth.user);
  const currentUserId: string = (authUser as any)?._id || (authUser as any)?.id || '';
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]); // oldest -> newest for MessageList
  const socketRef = useRef<Socket | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your media library to upload images');
      }
      const audioStatus = await Audio.requestPermissionsAsync();
      if (!audioStatus.granted) {
        Alert.alert('Permission required', 'Audio recording permission is required.');
      }
    })();
  }, []);

  // Load messages and connect socket on mount
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await loadMessages();
        await connectSocket();
        try { socketRef.current?.emit('mark_as_read', { conversationId }); } catch {}
      } catch {}
    };
    init();
    return () => {
      cancelled = true;
      try { socketRef.current?.disconnect(); } catch {}
    };
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/api/chat/conversations/${conversationId}/messages?page=1&limit=50`);
      const items = Array.isArray(res.data?.data) ? res.data.data : [];
      const mapped: Message[] = items.map(mapServerToUI); // already oldest->newest
      const unique: Message[] = [];
      const seed = new Set<string>();
      for (const m of mapped) {
        if (!seed.has(m.id)) {
          seed.add(m.id);
          unique.push(m);
        }
      }
      seenMessageIdsRef.current = seed;
      setMessages(unique);
    } catch {
      setMessages([]);
    }
  };

  const mapServerToUI = (m: any): Message => {
    const isImage = m.messageType === 'image';
    const isFile = m.messageType === 'file' || m.messageType === 'voice' || m.messageType === 'video';
    const title = m.messageType === 'text' ? m.content : isImage ? '' : m.fileName ? `[File] ${m.fileName}` : 'Attachment';
    const sender = m.sender ? { name: m.sender.name, avatar: m.sender.avatar } : undefined;
    const base: Message = {
      id: m._id,
      text: title,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSent: (m.sender?._id || m.sender?.id) === currentUserId,
      contactId: conversationId,
      sender,
    };
    if (isImage && m.mediaUrl) {
      return { ...base, attachment: { id: m._id, uri: m.mediaUrl, name: m.fileName || 'image', type: 'image' } };
    }
    if (isFile) {
      return { ...base, attachment: { id: m._id, uri: m.mediaUrl || '', name: m.fileName || 'file', type: 'document' } };
    }
    return base;
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
      setMessages((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, mapServerToUI(pm)]));
    });
  };

  const sendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;
    try {
      if (attachments.length > 0) {
        const att = attachments[0];
        await uploadAndSendMedia(att.uri, att.name, att.type === 'image' ? 'image/jpeg' : att.type === 'audio' ? 'audio/m4a' : 'application/octet-stream');
        setAttachments([]);
      }
      if (message.trim()) {
        socketRef.current?.emit('send_message', { conversationId, content: message.trim() }, (ack: any) => {
          if (ack?.success && ack.message) {
            const id = (ack.message as any)._id;
            if (!seenMessageIdsRef.current.has(id)) {
              seenMessageIdsRef.current.add(id);
              setMessages((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, mapServerToUI(ack.message)]));
            }
          }
        });
        setMessage('');
      }
    } catch {}
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const selectedImage = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(selectedImage.uri);
        const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

        if (!fileInfo.exists) {
          Alert.alert('Error', 'Selected image does not exist');
          return;
        }

        const newAttachment: Attachment = {
          id: Date.now().toString(),
          uri: selectedImage.uri,
          name: selectedImage.fileName || `image_${Date.now()}.jpg`,
          type: 'image',
          size,
        };
        setAttachments([newAttachment]);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const photo = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(photo.uri);
        const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

        if (!fileInfo.exists) {
          Alert.alert('Error', 'Photo does not exist');
          return;
        }

        const newAttachment: Attachment = {
          id: Date.now().toString(),
          uri: photo.uri,
          name: photo.fileName || `photo_${Date.now()}.jpg`,
          type: 'image',
          size,
        };
        setAttachments([newAttachment]);
      }
    } catch {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const selectedDoc = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(selectedDoc.uri);
        const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

        const newAttachment: Attachment = {
          id: Date.now().toString(),
          uri: selectedDoc.uri,
          name: selectedDoc.name || `document_${Date.now()}`,
          type: 'document',
          size,
        };
        setAttachments([newAttachment]);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const startRecording = async () => {
    try {
      if (recordingRef.current) {
        // If there's already a recording prepared, stop and unload it first
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start audio recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (uri) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

        const newAttachment: Attachment = {
          id: Date.now().toString(),
          uri,
          name: `audio_${Date.now()}.m4a`,
          type: 'audio',
          size,
        };
        setAttachments([newAttachment]);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Could not stop audio recording properly');
    } finally {
      setIsRecording(false);
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {}
        recordingRef.current = null;
      }
    }
  };

  const uploadAndSendMedia = async (uri: string, name: string, type: string) => {
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
              setMessages((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, mapServerToUI(ack.message)]));
            }
          }
        }
      );
    } finally {
      setIsUploading(false);
    }
  };

  const toggleGroupInfo = () => {
    setShowGroupInfo(!showGroupInfo);
  };

  const toggleMuteNotifications = () => {
    setGroup((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
    }));
  };

  const handleMessagePress = (msg: Message) => {
    setSelectedMessage(msg);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete', 'Forward', 'Copy'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) deleteMessage(msg.id);
          else if (buttonIndex === 2) forwardMessage(msg);
          else if (buttonIndex === 3) copyMessage(msg);
        }
      );
    } else {
      setShowMessageActions(true);
    }
  };

  const deleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    setShowMessageActions(false);
    setSelectedMessage(null);
  };

  const forwardMessage = (msg: Message) => {
    Alert.alert('Forward', `Message "${msg.text}" will be forwarded`);
    setShowMessageActions(false);
    setSelectedMessage(null);
  };

  const copyMessage = (msg: Message) => {
    if (msg.text) Alert.alert('Copied', 'Message copied to clipboard');
    setShowMessageActions(false);
    setSelectedMessage(null);
  };

  // Group Call Handlers
  const handleAudioCall = () => {
    navigation.navigate('CallScreen', {
      type: 'audio',
      group: group,
    });
  };

  const handleVideoCall = () => {
    navigation.navigate('CallScreen', {
      type: 'video',
      group: group,
    });
  };

  const showGroupOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'View Group Info', 'Mute Notifications', 'Exit Group'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 3,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) setShowGroupInfo(true);
          else if (buttonIndex === 2) toggleMuteNotifications();
          else if (buttonIndex === 3)
            Alert.alert('Exit Group', 'Are you sure you want to exit this group?');
        }
      );
    } else {
      setShowGroupInfo(true);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View className="mt-12 flex-1 flex-row bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="max-w-full flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white p-4">
          <View className="flex-row items-center">
            <BackButton />
            <TouchableOpacity onPress={toggleGroupInfo}>
              <View className="relative mr-3">
                {group.icon ? (
                  <Image source={{ uri: group.icon }} className="h-10 w-10 rounded-full" />
                ) : (
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                    <FontAwesome name="users" size={20} color="white" />
                  </View>
                )}
                <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
              </View>
            </TouchableOpacity>
            <View>
              <Text className="text-base font-semibold text-gray-900">{group.name}</Text>
              <Text className="text-xs text-gray-500">{group.members.length} members</Text>
            </View>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity className="p-2" onPress={handleAudioCall}>
              <FontAwesome name="phone" size={20} color="#1877f2" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2" onPress={handleVideoCall}>
              <FontAwesome name="video-camera" size={20} color="#1877f2" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2" onPress={showGroupOptions}>
              <Entypo name="dots-three-vertical" size={20} color="#1877f2" />
            </TouchableOpacity>
          </View>
        </View>

        <MessageList
          messages={useMemo(() => {
            const seen = new Set<string>();
            const out: Message[] = [];
            for (const m of messages) {
              if (m?.id && !seen.has(m.id)) {
                seen.add(m.id);
                out.push(m);
              }
            }
            return out;
          }, [messages])}
          scrollViewRef={scrollViewRef}
          handleMessagePress={handleMessagePress}
        />

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
      </KeyboardAvoidingView>

      {showGroupInfo && (
        <View className="absolute bottom-0 right-0 top-0 z-50">
          <GroupInfoPanel
            group={group}
            toggleGroupInfo={toggleGroupInfo}
            toggleMuteNotifications={toggleMuteNotifications}
          />
        </View>
      )}

      <MessageActionsModal
        visible={showMessageActions && Platform.OS === 'android'}
        onClose={() => setShowMessageActions(false)}
        selectedMessage={selectedMessage}
        onCopy={() => selectedMessage && copyMessage(selectedMessage)}
        onForward={() => selectedMessage && forwardMessage(selectedMessage)}
        onDelete={() => selectedMessage && deleteMessage(selectedMessage.id)}
      />
    </View>
  );
};

export default GroupChatScreen;
