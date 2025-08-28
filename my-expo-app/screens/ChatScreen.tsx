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
  Animated,
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
import { LinearGradient } from 'expo-linear-gradient';

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
  const inputHeightAnim = useRef(new Animated.Value(44)).current;
  const sendButtonScaleAnim = useRef(new Animated.Value(0.8)).current;

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

    // Animate send button
Animated.sequence([
  Animated.timing(sendButtonScaleAnim, {
    toValue: 1.2,
    duration: 100,
    useNativeDriver: true,
  }),
  Animated.timing(sendButtonScaleAnim, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true,
  }),
]).start();


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
      
      // Reset input height
      Animated.timing(inputHeightAnim, {
        toValue: 44,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setMessageText(text);
    
    // Animate input height based on content
    const newHeight = Math.min(Math.max(44, text.split('\n').length * 20 + 24), 120);
    Animated.timing(inputHeightAnim, {
      toValue: newHeight,
      duration: 100,
      useNativeDriver: false,
    }).start();
    
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
      <Animated.View
        style={[
          styles.messageContainer,
          own ? styles.ownMessageContainer : styles.otherMessageContainer,
          showSenderName && styles.firstMessageInGroup,
          isLastInGroup && styles.lastMessageInGroup
        ]}
      >
        <TouchableOpacity
          onLongPress={() => handleMessageLongPress(item)}
          delayLongPress={500}
          activeOpacity={0.9}
          style={styles.messageWrapper}
        >
          {showAvatar && (
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBorder}>
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
            {own ? (
              <LinearGradient
                colors={['#0084FF', '#0066CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBubble}
              >
                {renderMessageContent(item, own, showSenderName)}
              </LinearGradient>
            ) : (
              <View style={styles.otherBubbleContent}>
                {renderMessageContent(item, own, showSenderName)}
              </View>
            )}
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
      </Animated.View>
    );
  };

  const renderMessageContent = (item: ChatMessage, own: boolean, showSenderName: boolean) => {
    return (
      <>
        {showSenderName && (
          <View style={styles.senderInfo}>
            <Text style={[styles.senderName, { color: own ? '#FFFFFF' + 'CC' : theme.fontColor + 'CC' }]}>
              {item.sender.name || 'Unknown User'}
            </Text>
            {item.sender.verified && (
              <Ionicons name="checkmark-circle" size={14} color={own ? "#FFFFFF" : "#0084FF"} style={styles.verifiedIcon} />
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
                <View key={idx} style={[styles.attachmentItem, { backgroundColor: own ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 132, 255, 0.1)' }]}>
                  <Ionicons name="document" size={16} color={own ? '#FFFFFF' + 'CC' : '#0084FF'} />
                  <Text style={[styles.attachmentText, { color: own ? '#FFFFFF' + 'CC' : '#0084FF' }]}>
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
      </>
    );
  };

  const renderTypingIndicator = () => {
    const typingUsersInConversation = typingUsers[currentConversation?._id || ''] || [];
    const otherTypingUsers = typingUsersInConversation.filter(u => u.userId !== user?._id);

    if (otherTypingUsers.length === 0) return null;

    return (
      <Animated.View style={styles.typingContainer}>
        <View style={[styles.typingBubble, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
          <View style={styles.typingContent}>
            <View style={styles.typingDots}>
              <Animated.View style={[styles.dot, styles.dot1, { backgroundColor: theme.fontColor + '66' }]} />
              <Animated.View style={[styles.dot, styles.dot2, { backgroundColor: theme.fontColor + '66' }]} />
              <Animated.View style={[styles.dot, styles.dot3, { backgroundColor: theme.fontColor + '66' }]} />
            </View>
            <Text style={[styles.typingText, { color: theme.fontColor + '99' }]}>
              {otherTypingUsers.map(u => u.userName).join(', ')} {otherTypingUsers.length === 1 ? 'is' : 'are'} typing
            </Text>
          </View>
        </View>
      </Animated.View>
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
          <View style={[styles.dateChip, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#FFFFFF' }]}>
            <Text style={[styles.dateText, { color: theme.fontColor + '99' }]}>
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
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
    <View className='mt-12' style={[styles.container, { backgroundColor: theme.mode === 'dark' ? '#0A0A0A' : '#FAFAFA' }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={theme.mode === 'dark' ? ['#1A1A1A', '#242526'] : ['#FFFFFF', '#F8F9FA']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={[styles.iconContainer, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
            <Ionicons name="arrow-back" size={20} color={theme.fontColor} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerInfo} activeOpacity={0.8}>
          <View style={styles.avatarWrapper}>
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
            <View style={styles.avatarBadge} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.fontColor }]} numberOfLines={1}>
              {currentConversation.type === 'group' 
                ? currentConversation.name || 'Group Chat'
                : currentConversation.participants.find(p => p._id !== user?._id)?.name || 'Unknown User'
              }
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.fontColor + '99' }]} numberOfLines={1}>
              {currentConversation.type === 'group' 
                ? `${currentConversation.participants.length} members`
                : 'Active now'
              }
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.headerActionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
            <Ionicons name="call" size={18} color="#0084FF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerActionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}>
            <Ionicons name="videocam" size={18} color="#0084FF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerActionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]}
            onPress={() => setShowUserInfo(true)}
          >
            <Ionicons name="information-circle" size={18} color="#0084FF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages with Custom Background */}
      <View style={styles.messagesBackground}>
        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          renderItem={({ item, index }) => (
            <>
              {renderDateSeparator({ item, index })}
              {renderMessage({ item, index })}
            </>
          )}
          keyExtractor={(item, index) => `${item._id}-${index}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={renderTypingIndicator}
          inverted={false}
        />
      </View>

      {/* Enhanced Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: theme.mode === 'dark' ? '#1A1A1A' : '#FFFFFF' }]}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputActions}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]} onPress={handleDocumentPicker}>
              <Ionicons name="add" size={20} color="#0084FF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5' }]} onPress={handleImagePicker}>
              <Ionicons name="camera" size={20} color="#0084FF" />
            </TouchableOpacity>
          </View>
          
<Animated.View style={[
  styles.textInputContainer, 
  { 
    backgroundColor: theme.mode === 'dark' ? '#2A2A2A' : '#FFFFFF', // More contrast
    height: inputHeightAnim,
    borderWidth: 1,
    borderColor: theme.mode === 'dark' ? '#3A3B3C' : '#E4E6EB', // Add border for better definition
  }
          ]}>
            <TextInput
              style={[styles.textInput, { color: theme.fontColor }]}
              value={messageText}
              onChangeText={handleTyping}
              placeholder="Type a message..."
              placeholderTextColor={theme.fontColor + '66'}
              multiline
              maxLength={1000}
            />
          </Animated.View>
          
          <Animated.View style={[styles.sendButtonWrapper, { transform: [{ scale: sendButtonScaleAnim }] }]}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                { 
                  backgroundColor: messageText.trim() 
                    ? '#0084FF' 
                    : (theme.mode === 'dark' ? '#3A3B3C' : '#E4E6EB')
                }
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : messageText.trim() ? (
                <Ionicons name="send" size={16} color="#fff" />
              ) : (
                <Ionicons name="mic" size={16} color={theme.fontColor + '66'} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderBottomWidth: 0,
  },
  backButton: {
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0084FF',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesBackground: {
    flex: 1,
    position: 'relative',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginVertical: 1,
    maxWidth: width * 0.85,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    marginTop: 12,
  },
  lastMessageInGroup: {
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatarBorder: {
    position: 'relative',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E6EB',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageBubble: {
    borderRadius: 18,
    maxWidth: width * 0.75,
    minWidth: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    elevation: 4,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  otherBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  otherBubbleContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E6EB',
  },
  firstBubbleInGroup: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  lastBubbleInGroup: {
    // Custom radius handled by own/other bubble styles
  },
  noAvatarMargin: {
    marginLeft: 36,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  messageContent: {
    // Container for message text and attachments
  },
  ownMessageContent: {
    // Styles for own message content
  },
  otherMessageContent: {
    // Styles for other message content
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  editedIndicator: {
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.8,
    fontWeight: '500',
  },
  deletedMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
    fontWeight: '500',
  },
  editIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  attachmentContainer: {
    marginTop: 8,
    gap: 6,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  attachmentText: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '600',
    flex: 1,
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
    fontWeight: '500',
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  statusIcon: {
    marginLeft: 1,
  },
  typingContainer: {
    marginVertical: 8,
    alignSelf: 'flex-start',
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    maxWidth: width * 0.6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 3,
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
    fontSize: 13,
    fontWeight: '500',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
 textInputContainer: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced padding
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
    textAlignVertical: 'center',
    padding: 0, // Remove default padding
    margin: 0, // Remove default margin
  },
  sendButtonWrapper: {
    // Wrapper for send button animation
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ChatScreen;