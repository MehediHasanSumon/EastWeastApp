import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  AppState,
  AppStateStatus,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMessages, sendMessage, addMessage, setTypingUser } from '../store/chatSlice';
import { chatSocketService } from '../utils/chatSocket';
import { ChatMessage, SocketMessage } from '../types/chat';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import UserInfoModal from '../components/UserInfoModal';
import notificationService from '../utils/notificationService';
import { useToast } from '../context/ToastContext';
import ToastContainer from '../components/ToastContainer';
import CallActionButtons from '../components/CallActionButtons';
import GlobalCallManager from '../components/GlobalCallManager';
import EnhancedMessageInput from '../components/EnhancedMessageInput';
import EnhancedMessageBubble from '../components/EnhancedMessageBubble';
import MessageForwardModal from '../components/MessageForwardModal';

const { width, height } = Dimensions.get('window');

const EnhancedChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme } = useContext(ThemeContext);
  const { user } = useAppSelector((state) => state.auth);
  const { currentConversation, messages, typingUsers, isLoading } = useAppSelector((state) => state.chat);
  const { showToast } = useToast();
  
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<ChatMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (currentConversation) {
      loadMessages();
      setupSocketListeners();
      joinConversation();
    }
  }, [currentConversation]);

  useEffect(() => {
    // Initialize notifications
    notificationService.initialize();

    // Handle app state changes for notifications
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        notificationService.clearBadge();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
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
      
      // Show push notification if app is in background
      if (appState.current !== 'active' && currentConversation) {
        if (currentConversation.type === 'group') {
          notificationService.showGroupChatNotification(
            currentConversation.name || 'Group Chat',
            message.sender.name,
            message.content,
            currentConversation._id
          );
        } else {
          notificationService.showChatNotification(
            message.sender.name,
            message.content,
            currentConversation._id
          );
        }
      }
       
      // Show in-app toast notification
      if (appState.current === 'active' && currentConversation) {
        const senderName = message.sender.name || 'Unknown User';
        const notificationMessage = currentConversation.type === 'group' 
          ? `${currentConversation.name}: ${senderName}`
          : senderName;
         
        showToast(`${notificationMessage}: ${message.content}`, 'info', 4000);
      }
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

    // Listen for message reactions
    chatSocketService.on('message_reaction', (data: any) => {
      // Update message reactions in store
      console.log('Message reaction received:', data);
    });

    // Listen for message edits
    chatSocketService.on('message_edited', (data: any) => {
      // Update message content in store
      console.log('Message edited:', data);
    });

    // Listen for message deletions
    chatSocketService.on('message_deleted', (data: any) => {
      // Mark message as deleted in store
      console.log('Message deleted:', data);
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

  const handleSendMessage = async (messageData: {
    content: string;
    messageType: 'text' | 'image' | 'file' | 'voice';
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    replyTo?: string;
  }) => {
    if (!currentConversation) return;

    try {
      const socketMessage: SocketMessage = {
        conversationId: currentConversation._id,
        content: messageData.content,
        messageType: messageData.messageType,
        mediaUrl: messageData.mediaUrl,
        fileName: messageData.fileName,
        fileSize: messageData.fileSize,
        duration: messageData.duration,
        replyTo: messageData.replyTo,
      };

      const result = await chatSocketService.sendMessage(socketMessage);
      
      if (result.success) {
        // Clear reply if message was sent successfully
        if (messageData.replyTo) {
          setReplyToMessage(null);
        }
        scrollToBottom();
      } else {
        Alert.alert('Error', result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleMessageReaction = (messageId: string, emoji: string) => {
    try {
      chatSocketService.reactToMessage(messageId, { type: 'reaction', emoji });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleMessageEdit = (messageId: string, newContent: string) => {
    try {
      chatSocketService.editMessage(messageId, newContent);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleMessageDelete = (messageId: string, deleteForEveryone: boolean) => {
    try {
      if (deleteForEveryone) {
        chatSocketService.deleteMessage(messageId);
      } else {
        // Handle local deletion (remove from view)
        console.log('Message removed locally');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleMessageReply = (message: ChatMessage) => {
    setReplyToMessage(message);
  };

  const handleMessageForward = (message: ChatMessage) => {
    setForwardMessage(message);
    setShowForwardModal(true);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.sender._id === user?._id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <EnhancedMessageBubble
          message={item}
          isOwnMessage={isOwnMessage}
          onReact={handleMessageReaction}
          onEdit={handleMessageEdit}
          onDelete={handleMessageDelete}
          onReply={handleMessageReply}
          onForward={handleMessageForward}
        />
      </View>
    );
  };

  const renderTypingIndicator = () => {
    const typingUser = typingUsers.find(t => t.conversationId === currentConversation?._id);
    
    if (!typingUser?.isTyping) return null;

    return (
      <View style={[styles.typingIndicator, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
        <Text style={[styles.typingText, { color: theme.fontColor + '99' }]}>
          {typingUser.userName} is typing...
        </Text>
      </View>
    );
  };

  if (!currentConversation) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
        <Text style={[styles.noConversationText, { color: theme.fontColor }]}>
          No conversation selected
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bgColor}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bgColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.fontColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => setShowUserInfo(true)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentConversation.type === 'direct' 
                ? currentConversation.participants.find(p => p._id !== user?._id)?.name?.charAt(0)?.toUpperCase() || 'U'
                : currentConversation.name?.charAt(0)?.toUpperCase() || 'G'
              }
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.fontColor }]}>
              {currentConversation.type === 'direct'
                ? currentConversation.participants.find(p => p._id !== user?._id)?.name || 'Unknown User'
                : currentConversation.name || 'Group Chat'
              }
            </Text>
            <Text style={[styles.userStatus, { color: theme.fontColor + '99' }]}>
              {currentConversation.type === 'direct' ? 'Direct Message' : `${currentConversation.participants.length} members`}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {currentConversation.type === 'direct' && (
            <CallActionButtons
              conversationId={currentConversation._id}
              remoteUserId={currentConversation.participants.find(p => p._id !== user?._id)?._id || ''}
              remoteUserName={currentConversation.participants.find(p => p._id !== user?._id)?.name || 'Unknown User'}
            />
          )}
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowUserInfo(true)}
          >
            <Ionicons name="information-circle" size={24} color={theme.fontColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderTypingIndicator}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles" size={64} color={theme.fontColor + '33'} />
            <Text style={[styles.emptyText, { color: theme.fontColor + '66' }]}>
              No messages yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.fontColor + '99' }]}>
              Start the conversation by sending a message
            </Text>
          </View>
        }
      />

      {/* Enhanced Message Input */}
      <EnhancedMessageInput
        conversationId={currentConversation._id}
        onSendMessage={handleSendMessage}
        replyTo={replyToMessage}
        onCancelReply={handleCancelReply}
      />

      {/* Modals */}
      <UserInfoModal
        visible={showUserInfo}
        onClose={() => setShowUserInfo(false)}
        conversation={currentConversation}
      />

      <MessageForwardModal
        visible={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setForwardMessage(null);
        }}
        message={forwardMessage}
        conversations={[]} // Pass conversations from store
      />

      <GlobalCallManager />
      <ToastContainer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  typingIndicator: {
    padding: 12,
    borderRadius: 18,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  noConversationText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});

export default EnhancedChatScreen;
