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
  StatusBar,
  AppState,
  AppStateStatus,
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
import UserInfoModal from '../components/UserInfoModal';
import notificationService from '../utils/notificationService';
import MessageActions from '../components/MessageActions';
import MessageReactions from '../components/MessageReactions';
import { useToast } from '../context/ToastContext';
import ToastContainer from '../components/ToastContainer';

const { width, height } = Dimensions.get('window');

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme } = useContext(ThemeContext);
  const { user } = useAppSelector((state) => state.auth);
  const { currentConversation, messages, typingUsers, isLoading } = useAppSelector((state) => state.chat);
  const { showToast } = useToast();
  
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
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
        // App came to foreground, clear badge
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

  // Message Action Handlers
  const handleMessageLongPress = (message: ChatMessage) => {
    setSelectedMessage(message);
    setShowMessageActions(true);
  };

  const handleMessageReact = (emoji: string) => {
    if (selectedMessage) {
      // TODO: Implement reaction logic with socket
      console.log('React to message:', selectedMessage._id, 'with emoji:', emoji);
      // chatSocketService.reactToMessage(selectedMessage._id, emoji);
    }
  };

  const handleMessageEdit = (newContent: string) => {
    if (selectedMessage) {
      // TODO: Implement edit logic with socket
      console.log('Edit message:', selectedMessage._id, 'to:', newContent);
      // chatSocketService.editMessage(selectedMessage._id, newContent);
    }
  };

  const handleMessageDelete = (deleteForEveryone: boolean) => {
    if (selectedMessage) {
      // TODO: Implement delete logic with socket
      console.log('Delete message:', selectedMessage._id, 'for everyone:', deleteForEveryone);
      // chatSocketService.deleteMessage(selectedMessage._id, deleteForEveryone);
    }
  };

  const handleMessageReply = () => {
    if (selectedMessage) {
      // TODO: Implement reply logic
      console.log('Reply to message:', selectedMessage._id);
      setShowMessageActions(false);
    }
  };

  const handleMessageForward = () => {
    if (selectedMessage) {
      // TODO: Implement forward logic
      console.log('Forward message:', selectedMessage._id);
      setShowMessageActions(false);
    }
  };

  const handleReactionPress = (emoji: string) => {
    // TODO: Implement reaction toggle logic
    console.log('Toggle reaction:', emoji);
  };

  const handleReactionLongPress = (emoji: string) => {
    // TODO: Show reaction details
    console.log('Show reaction details for:', emoji);
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: ChatMessage): boolean => {
    return message.sender._id === user?._id;
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const own = isOwnMessage(item);
    const conversationMessages = messages[currentConversation?._id || ''] || [];
    const prevMessage = index > 0 ? conversationMessages[index - 1] : null;
    const nextMessage = index < conversationMessages.length - 1 ? conversationMessages[index + 1] : null;
    
    const showAvatar = !own && (!nextMessage || nextMessage.sender._id !== item.sender._id);
    const showSenderName = !own && (!prevMessage || prevMessage.sender._id !== item.sender._id);
    const isLastInGroup = !nextMessage || nextMessage.sender._id !== item.sender._id;
    const isFirstInGroup = !prevMessage || prevMessage.sender._id !== item.sender._id;

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          own ? styles.ownMessageContainer : styles.otherMessageContainer,
          showSenderName && styles.firstMessageInGroup,
          isLastInGroup && styles.lastMessageInGroup
        ]}
        onLongPress={() => handleMessageLongPress(item)}
        delayLongPress={500}
        activeOpacity={0.9}
      >
        {showAvatar && (
          <View style={styles.avatarContainer}>
            <Image
              source={
                item.sender.avatar
                  ? { uri: item.sender.avatar }
                  : require('../assets/default-avatar.png')
              }
              style={styles.messageAvatar}
            />
            {item.sender.online && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          own ? styles.ownBubble : styles.otherBubble,
          showSenderName && styles.firstBubbleInGroup,
          isLastInGroup && styles.lastBubbleInGroup,
          isFirstInGroup && styles.firstBubbleInGroup,
          !showAvatar && styles.noAvatarMargin
        ]}>
          {showSenderName && (
            <View style={styles.senderInfo}>
              <Text style={[styles.senderName, { color: theme.fontColor + 'CC' }]}>
                {item.sender.name || 'Unknown User'}
              </Text>
              {item.sender.verified && (
                <Ionicons name="checkmark-circle" size={14} color="#0084FF" style={styles.verifiedIcon} />
              )}
            </View>
          )}
          
          <View style={[
            styles.messageContent,
            own ? styles.ownMessageContent : styles.otherMessageContent
          ]}>
            {item.isDeleted ? (
              <Text style={[styles.deletedMessage, { color: own ? '#FFFFFF' + 'CC' : theme.fontColor + '99' }]}>
                <Ionicons name="remove-circle" size={14} color={own ? '#FFFFFF' + 'CC' : theme.fontColor + '99'} />
                {' '}This message was deleted
              </Text>
            ) : (
              <Text style={[styles.messageText, { color: own ? '#FFFFFF' : theme.fontColor }]}>
                {item.content}
                {item.isEdited && (
                  <Text style={[styles.editedIndicator, { color: own ? '#FFFFFF' + 'CC' : theme.fontColor + '99' }]}>
                    {' '}(edited)
                  </Text>
                )}
              </Text>
            )}
            
            {item.attachments && item.attachments.length > 0 && (
              <View style={styles.attachmentContainer}>
                {item.attachments.map((attachment, idx) => (
                  <View key={idx} style={styles.attachmentItem}>
                    <Ionicons name="document" size={16} color={own ? '#FFFFFF' + 'CC' : theme.fontColor + '99'} />
                    <Text style={[styles.attachmentText, { color: own ? '#FFFFFF' + 'CC' : theme.fontColor + '99' }]}>
                      {attachment.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, { color: own ? '#FFFFFF' + 'CC' : theme.fontColor + '99' }]}>
              {formatTime(item.createdAt)}
            </Text>
            {own && (
              <View style={styles.messageStatus}>
                {item.status === 'sent' && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.statusIcon} />
                )}
                {item.status === 'delivered' && (
                  <Ionicons name="checkmark-done" size={14} color="#FFFFFF" style={styles.statusIcon} />
                )}
                {item.status === 'read' && (
                  <Ionicons name="checkmark-done" size={14} color="#00D4FF" style={styles.statusIcon} />
                )}
              </View>
            )}
          </View>
        </View>
        
        {/* Message Reactions */}
        <MessageReactions
          message={item}
          onReactionPress={handleReactionPress}
          onReactionLongPress={handleReactionLongPress}
        />
        
        {/* Edit Indicator */}
        {own && item.canEdit && !item.isDeleted && (
          <View style={styles.editIndicator}>
            <Ionicons name="create-outline" size={12} color={theme.fontColor + '66'} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderTypingIndicator = () => {
    const typingUsersInConversation = typingUsers[currentConversation?._id || ''] || [];
    const otherTypingUsers = typingUsersInConversation.filter(u => u.userId !== user?._id);

    if (otherTypingUsers.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={[styles.typingBubble, styles.otherBubble]}>
          <View style={styles.typingContent}>
            <View style={styles.typingDots}>
              <View style={[styles.dot, styles.dot1, { backgroundColor: theme.fontColor + '66' }]} />
              <View style={[styles.dot, styles.dot2, { backgroundColor: theme.fontColor + '66' }]} />
              <View style={[styles.dot, styles.dot3, { backgroundColor: theme.fontColor + '66' }]} />
            </View>
            <Text style={[styles.typingText, { color: theme.fontColor + '99' }]}>
              {otherTypingUsers.map(u => u.userName).join(', ')} {otherTypingUsers.length === 1 ? 'is' : 'are'} typing
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDateSeparator = ({ item, index }: { item: ChatMessage; index: number }) => {
    const conversationMessages = messages[currentConversation?._id || ''] || [];
    const prevMessage = index > 0 ? conversationMessages[index - 1] : null;
    
    if (!prevMessage) return null;
    
    const currentDate = new Date(item.createdAt).toDateString();
    const prevDate = new Date(prevMessage.createdAt).toDateString();
    
    if (currentDate !== prevDate) {
      return (
        <View style={styles.dateSeparator}>
          <View style={[styles.dateLine, { backgroundColor: theme.fontColor + '20' }]} />
          <Text style={[styles.dateText, { color: theme.fontColor + '99' }]}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <View style={[styles.dateLine, { backgroundColor: theme.fontColor + '20' }]} />
        </View>
      );
    }
    
    return null;
  };

  if (!currentConversation) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
        <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
        <Text style={[styles.errorText, { color: theme.fontColor }]}>
          No conversation selected
        </Text>
      </View>
    );
  }

  const conversationMessages = messages[currentConversation._id] || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.mode === 'dark' ? '#1A1A1A' : '#F0F2F5' }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.fontColor} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerInfo}>
          <Image
            source={
              currentConversation.type === 'group' 
                ? require('../assets/group-icon.png')
                : currentConversation.participants.find(p => p._id !== user?._id)?.avatar
                  ? { uri: currentConversation.participants.find(p => p._id !== user?._id)?.avatar }
                  : require('../assets/default-avatar.png')
            }
            style={styles.headerAvatar}
          />
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.fontColor }]}>
              {currentConversation.type === 'group' 
                ? currentConversation.name || 'Group Chat'
                : currentConversation.participants.find(p => p._id !== user?._id)?.name || 'Unknown User'
              }
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.fontColor + '99' }]}>
              {currentConversation.type === 'group' 
                ? `${currentConversation.participants.length} members`
                : 'Online'
              }
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="call" size={20} color={theme.fontColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="videocam" size={20} color={theme.fontColor} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => setShowUserInfo(true)}
          >
            <Ionicons name="information-circle" size={20} color={theme.fontColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={conversationMessages}
        renderItem={({ item, index }) => (
          <>
            {renderDateSeparator({ item, index })}
            {renderMessage({ item, index })}
          </>
        )}
        keyExtractor={(item) => item._id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={renderTypingIndicator}
        inverted={false}
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF' }]}>
        <View style={styles.inputActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDocumentPicker}>
            <Ionicons name="attach" size={22} color={theme.fontColor + 'CC'} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleImagePicker}>
            <Ionicons name="camera" size={22} color={theme.fontColor + 'CC'} />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.textInputContainer, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
          <TextInput
            style={[styles.textInput, { color: theme.fontColor }]}
            value={messageText}
            onChangeText={handleTyping}
            placeholder="Aa"
            placeholderTextColor={theme.fontColor + '66'}
            multiline
            maxLength={1000}
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            { 
              backgroundColor: messageText.trim() 
                ? (theme.mode === 'dark' ? '#6366F1' : '#0084FF') 
                : (theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5')
            }
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : messageText.trim() ? (
            <Ionicons name="send" size={18} color="#fff" />
          ) : (
            <Ionicons name="mic" size={18} color={theme.fontColor + '66'} />
          )}
        </TouchableOpacity>
      </View>

      {/* User Info Modal */}
      <UserInfoModal
        visible={showUserInfo}
        onClose={() => setShowUserInfo(false)}
        conversation={currentConversation}
        currentUser={user}
      />

      {/* Message Actions Modal */}
      {selectedMessage && (
        <MessageActions
          visible={showMessageActions}
          onClose={() => {
            setShowMessageActions(false);
            setSelectedMessage(null);
          }}
          message={selectedMessage}
          isOwnMessage={isOwnMessage(selectedMessage)}
          onReact={handleMessageReact}
          onEdit={handleMessageEdit}
          onDelete={handleMessageDelete}
          onReply={handleMessageReply}
          onForward={handleMessageForward}
        />
      )}
      
      {/* Toast Container for notifications */}
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E6EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    maxWidth: width * 0.85,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    marginLeft: width * 0.15,
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    marginRight: width * 0.15,
  },
  firstMessageInGroup: {
    marginTop: 8,
  },
  lastMessageInGroup: {
    marginBottom: 8,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginTop: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: width * 0.75,
    minWidth: 80,
    position: 'relative',
  },
  ownBubble: {
    backgroundColor: '#0084FF',
    borderBottomRightRadius: 6,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#E4E6EB',
  },
  firstBubbleInGroup: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  lastBubbleInGroup: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  noAvatarMargin: {
    marginLeft: 0, // No margin if avatar is not shown
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  messageContent: {
    // Basic styles for message content
  },
  ownMessageContent: {
    // Styles for own messages
  },
  otherMessageContent: {
    // Styles for other messages
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  editedIndicator: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  deletedMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
  },
  editIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  attachmentContainer: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  attachmentText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  statusIcon: {
    marginLeft: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  typingContainer: {
    marginVertical: 8,
    alignSelf: 'flex-start',
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    maxWidth: width * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
    opacity: 0.7,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  typingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    borderRadius: 0.5,
  },
  dateText: {
    fontSize: 12,
    marginHorizontal: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E4E6EB',
  },
  inputActions: {
    flexDirection: 'row',
    marginRight: 8,
  },
  actionButton: {
    padding: 8,
    marginRight: 4,
  },
  textInputContainer: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 120,
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textInput: {
    fontSize: 16,
    maxHeight: 100,
    minHeight: 20,
    fontWeight: '400',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});

export default ChatScreen;
