import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMessages, sendMessage, addMessage, setTypingUser } from '../store/chatSlice';
import { chatSocketService } from '../utils/chatSocket';
import { ChatMessage, SocketMessage } from '../types/chat';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width } = Dimensions.get('window');

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme } = useContext(ThemeContext);
  const { user } = useAppSelector((state) => state.auth);
  const { currentConversation, messages, typingUsers, isLoading } = useAppSelector((state) => state.chat);
  
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (currentConversation) {
      loadMessages();
      setupSocketListeners();
      joinConversation();
    }
  }, [currentConversation]);

  useEffect(() => {
    return () => {
      if (currentConversation) {
        leaveConversation();
      }
    };
  }, []);

  const setupSocketListeners = () => {
    // Listen for new messages
    chatSocketService.on('new_message', (message: ChatMessage) => {
      dispatch(addMessage(message));
      scrollToBottom();
    });

    // Listen for typing indicators
    chatSocketService.on('typing_start', (data: any) => {
      dispatch(setTypingUser({
        conversationId: data.conversationId,
        userId: data.userId,
        userName: data.userName,
        isTyping: true,
      }));
    });

    chatSocketService.on('typing_stop', (data: any) => {
      dispatch(setTypingUser({
        conversationId: data.conversationId,
        userId: data.userId,
        userName: '',
        isTyping: false,
      }));
    });

    // Listen for message delivery and read status
    chatSocketService.on('message_delivered', (data: any) => {
      // Update message delivery status
    });

    chatSocketService.on('message_read', (data: any) => {
      // Update message read status
    });
  };

  const loadMessages = async () => {
    if (!currentConversation) return;
    
    try {
      await dispatch(fetchMessages({ conversationId: currentConversation._id })).unwrap();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load messages');
    }
  };

  const joinConversation = () => {
    if (currentConversation) {
      chatSocketService.joinConversation(currentConversation._id);
    }
  };

  const leaveConversation = () => {
    if (currentConversation) {
      chatSocketService.leaveConversation(currentConversation._id);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentConversation || isSending) return;

    setIsSending(true);
    const messageData: SocketMessage = {
      conversationId: currentConversation._id,
      content: messageText.trim(),
      messageType: 'text',
    };

    try {
      await dispatch(sendMessage(messageData)).unwrap();
      setMessageText('');
      stopTyping();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setMessageText(text);
    
    if (!isTyping) {
      setIsTyping(true);
      chatSocketService.startTyping(currentConversation!._id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      chatSocketService.stopTyping(currentConversation!._id);
    }, 1000);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      chatSocketService.stopTyping(currentConversation!._id);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Handle image upload and send
        console.log('Image selected:', result.assets[0]);
        // TODO: Implement image upload and sending
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        // Handle document upload and send
        console.log('Document selected:', result.assets[0]);
        // TODO: Implement document upload and sending
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: ChatMessage): boolean => {
    return message.sender._id === user?._id;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const own = isOwnMessage(item);

    return (
      <View style={[styles.messageContainer, own ? styles.ownMessage : styles.otherMessage]}>
        {!own && (
          <Image
            source={
              item.sender.avatar
                ? { uri: item.sender.avatar }
                : require('../assets/default-avatar.png')
            }
            style={styles.messageAvatar}
          />
        )}
        
        <View style={[styles.messageBubble, own ? styles.ownBubble : styles.otherBubble]}>
          {!own && (
            <Text style={[styles.senderName, { color: theme.fontColor + '80' }]}>
              {item.sender.name}
            </Text>
          )}
          
          <Text style={[styles.messageText, { color: own ? '#fff' : theme.fontColor }]}>
            {item.content}
          </Text>
          
          <Text style={[styles.messageTime, { color: own ? '#fff' + '80' : theme.fontColor + '60' }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    const typingUsersInConversation = typingUsers[currentConversation?._id || ''] || [];
    const otherTypingUsers = typingUsersInConversation.filter(u => u.userId !== user?._id);

    if (otherTypingUsers.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={[styles.typingBubble, styles.otherBubble]}>
          <Text style={[styles.typingText, { color: theme.fontColor + '80' }]}>
            {otherTypingUsers.map(u => u.userName).join(', ')} {otherTypingUsers.length === 1 ? 'is' : 'are'} typing...
          </Text>
          <View style={styles.typingDots}>
            <View style={[styles.dot, { backgroundColor: theme.fontColor + '40' }]} />
            <View style={[styles.dot, { backgroundColor: theme.fontColor + '40' }]} />
            <View style={[styles.dot, { backgroundColor: theme.fontColor + '40' }]} />
          </View>
        </View>
      </View>
    );
  };

  if (!currentConversation) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
        <Text style={[styles.errorText, { color: theme.fontColor }]}>
          No conversation selected
        </Text>
      </View>
    );
  }

  const conversationMessages = messages[currentConversation._id] || [];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bgColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.fontColor} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.fontColor }]}>
            {currentConversation.type === 'group' 
              ? currentConversation.name || 'Group Chat'
              : currentConversation.participants.find(p => p._id !== user?._id)?.name || 'Unknown User'
            }
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.fontColor + '80' }]}>
            {currentConversation.participants.length} participants
          </Text>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.fontColor} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={conversationMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        style={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={renderTypingIndicator}
        inverted={false}
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: theme.bgColor }]}>
        <TouchableOpacity style={styles.attachButton} onPress={handleDocumentPicker}>
          <Ionicons name="attach" size={24} color={theme.fontColor} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cameraButton} onPress={handleImagePicker}>
          <Ionicons name="camera" size={24} color={theme.fontColor} />
        </TouchableOpacity>
        
        <View style={[styles.textInputContainer, { backgroundColor: theme.mode === 'dark' ? '#333' : '#f5f5f5' }]}>
          <TextInput
            style={[styles.textInput, { color: theme.fontColor }]}
            value={messageText}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            placeholderTextColor={theme.fontColor + '60'}
            multiline
            maxLength={1000}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: messageText.trim() ? '#6366F1' : '#ccc' }]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 5,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  moreButton: {
    padding: 5,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    maxWidth: width * 0.8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: width * 0.7,
  },
  ownBubble: {
    backgroundColor: '#6366F1',
  },
  otherBubble: {
    backgroundColor: '#F3F4F6',
  },
  senderName: {
    fontSize: 12,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingContainer: {
    marginVertical: 5,
  },
  typingBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: width * 0.7,
  },
  typingText: {
    fontSize: 14,
  },
  typingDots: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachButton: {
    padding: 8,
    marginRight: 5,
  },
  cameraButton: {
    padding: 8,
    marginRight: 5,
  },
  textInputContainer: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 16,
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});

export default ChatScreen;
