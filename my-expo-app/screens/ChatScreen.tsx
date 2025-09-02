import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  StatusBar,
  AppState,
  AppStateStatus,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMessages, sendMessage, addMessage, setTypingUser, addMessageReaction, removeMessageReaction, removeMessage, deleteMessage } from '../store/chatSlice';
import { chatSocketService } from '../utils/chatSocket';
import { ChatMessage, SocketMessage, ChatUser } from '../types/chat';
import { chatApiService } from '../utils/chatApi';

// Map emojis to backend reaction types
const REACTION_EMOJIS = [
  { emoji: '👍', type: 'like' },
  { emoji: '❤️', type: 'love' },
  { emoji: '😀', type: 'laugh' },
  { emoji: '😢', type: 'sad' },
  { emoji: '😡', type: 'angry' },
  { emoji: '🎉', type: 'wow' }
];
import { ThemeContext } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import UserInfoModal from '../components/UserInfoModal';
import notificationService from '../utils/notificationService';
import MessageActions from '../components/MessageActions';
import ReactionPicker from '../components/ReactionPicker';
import ForwardModal from '../components/ForwardModal';
import { useToast } from '../context/ToastContext';
import ToastContainer from '../components/ToastContainer';
import {
  ChatHeader,
  ChatMessage as ChatMessageComponent,
  ChatInput,
  TypingIndicator,
  DateSeparator,
} from '../components/Chat';

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const themeContext = useContext(ThemeContext);
  const { user } = useAppSelector((state) => state.auth);
  const { currentConversation, messages, typingUsers, isLoading, conversations } = useAppSelector((state) => state.chat);
  const { showToast } = useToast();
  
  // Safety check for theme context
  if (!themeContext) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading theme...</Text>
      </View>
    );
  }
  
  const { theme } = themeContext;
  
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionMessageId, setReactionMessageId] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [forwardMessage, setForwardMessage] = useState<ChatMessage | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
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
    
    // Cleanup function to remove listeners when component unmounts or conversation changes
    return () => {
      if (currentConversation) {
        leaveConversation();
        // Remove all socket listeners
        chatSocketService.off('new_message');
        chatSocketService.off('typing_start');
        chatSocketService.off('typing_stop');
        chatSocketService.off('message_delivered');
        chatSocketService.off('message_read');
        chatSocketService.off('message_deleted');
        chatSocketService.off('message_reaction');
      }
    };
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
    // Remove any existing listeners first to prevent duplicates
    chatSocketService.off('new_message');
    chatSocketService.off('typing_start');
    chatSocketService.off('typing_stop');
    chatSocketService.off('message_delivered');
    chatSocketService.off('message_read');
    chatSocketService.off('message_deleted');
    chatSocketService.off('message_reaction');
    
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

           // Listen for message deletion
      chatSocketService.on('message_deleted', (data: any) => {
        try {
          if (__DEV__) console.log('🗑️ Received message_deleted event:', data);
          const { messageId } = data;
          
          if (currentConversation) {
            // Backend only supports soft delete, so always mark as deleted
            dispatch(deleteMessage({
              messageId,
              conversationId: currentConversation._id,
              deleteForEveryone: false,
            }));
          }
        } catch (error) {
          console.error('❌ Error processing message_deleted event:', error);
        }
      });

         // Listen for message reactions
     chatSocketService.on('message_reaction', (data: any) => {
       try {
         if (__DEV__) console.log('🔔 Received message_reaction event:', data);
         
         if (!data || typeof data !== 'object') {
           console.error('❌ Invalid message_reaction data - not an object:', data);
           return;
         }
         
         const { messageId, userId, reactionType, emoji } = data;
         
         if (!messageId || !userId || reactionType === undefined) {
           console.error('❌ Invalid message_reaction data - missing required fields:', { messageId, userId, reactionType, emoji });
           return;
         }
         
         if (currentConversation) {
           if (reactionType === 'remove') {
             if (__DEV__) console.log('🗑️ Removing reaction for message:', messageId);
             // Remove reaction
             dispatch(removeMessageReaction({
               messageId,
               userId,
               conversationId: currentConversation._id,
             }));
           } else {
             if (__DEV__) console.log('➕ Adding reaction for message:', messageId, 'emoji:', emoji);
             // Add reaction
             dispatch(addMessageReaction({
               messageId,
               userId,
               reactionType: 'add',
               emoji,
               conversationId: currentConversation._id,
             }));
           }
         }
       } catch (error) {
         console.error('❌ Error processing message_reaction event:', error);
         console.error('❌ Event data:', data);
       }
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
      replyTo: replyToMessage?._id,
    };

    try {
      await dispatch(sendMessage(messageData)).unwrap();
      setMessageText('');
      setReplyToMessage(null); // Clear reply after sending
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
        allowsEditing: false, // No cropping - keep original dimensions
        quality: 0.9, // Higher quality for better image preservation
        allowsMultipleSelection: false, // Single image selection
        exif: false, // Don't include EXIF data for privacy
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        if (__DEV__) console.log('Image selected (no crop):', selectedAsset);
        
        // Show loading state
        setIsSending(true);
        
        try {
          // Determine file type based on asset
          const fileType = selectedAsset.type || 'image/jpeg';
          const fileExtension = fileType.includes('jpeg') ? 'jpg' : 
                               fileType.includes('png') ? 'png' : 
                               fileType.includes('gif') ? 'gif' : 'jpg';
          
          // Create file object for upload with proper structure
          const file = {
            uri: selectedAsset.uri,
            type: fileType,
            name: `image_${Date.now()}.${fileExtension}`,
            fileSize: selectedAsset.fileSize || 0,
          };
          
          if (__DEV__) {
            console.log('Prepared file for upload:', file);
          }
          
          // Upload the image
          const uploadResult = await chatApiService.uploadMedia(file);
          if (__DEV__) console.log('Image uploaded:', uploadResult);
          
          // Send the image message
          if (currentConversation) {
            const imageMessage: SocketMessage = {
              conversationId: currentConversation._id,
              content: '', // Optional caption
              messageType: 'image',
              mediaUrl: uploadResult.url,
              fileName: uploadResult.fileName,
              fileSize: uploadResult.fileSize,
            };
            
            // Send via WebSocket
            chatSocketService.sendMessage(imageMessage);
            
            // Show success toast
            showToast('Image sent successfully (no crop)', 'success', 3000);
          }
        } catch (uploadError: any) {
          if (__DEV__) console.error('Failed to upload image:', uploadError);
          
          // Provide more specific error messages
          let errorMessage = 'Failed to upload image';
          if (uploadError.message) {
            errorMessage = uploadError.message;
          } else if (uploadError.response?.data?.message) {
            errorMessage = uploadError.response.data.message;
          }
          
          showToast(errorMessage, 'error', 5000);
        } finally {
          setIsSending(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCameraCapture = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('Camera permission is required to take photos', 'error', 5000);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // No cropping - keep original dimensions
        quality: 0.9, // Higher quality for better image preservation
      });

      if (!result.canceled && result.assets[0]) {
        const capturedAsset = result.assets[0];
        if (__DEV__) console.log('Photo captured (no crop):', capturedAsset);
        
        // Show loading state
        setIsSending(true);
        
        try {
          // Determine file type based on asset
          const fileType = capturedAsset.type || 'image/jpeg';
          const fileExtension = fileType.includes('jpeg') ? 'jpg' : 
                               fileType.includes('png') ? 'png' : 
                               fileType.includes('gif') ? 'gif' : 'jpg';
          
          // Create file object for upload with proper structure
          const file = {
            uri: capturedAsset.uri,
            type: fileType,
            name: `photo_${Date.now()}.${fileExtension}`,
            fileSize: capturedAsset.fileSize || 0,
          };
          
          if (__DEV__) {
            console.log('Prepared photo for upload:', file);
          }
          
          // Upload the captured photo
          const uploadResult = await chatApiService.uploadMedia(file);
          if (__DEV__) console.log('Photo uploaded:', uploadResult);
          
          // Send the photo message
          if (currentConversation) {
            const photoMessage: SocketMessage = {
              conversationId: currentConversation._id,
              content: '', // Optional caption
              messageType: 'image',
              mediaUrl: uploadResult.url,
              fileName: uploadResult.fileName,
              fileSize: uploadResult.fileSize,
            };
            
            // Send via WebSocket
            chatSocketService.sendMessage(photoMessage);
            
            // Show success toast
            showToast('Photo captured and sent successfully (no crop)', 'success', 3000);
          }
        } catch (uploadError: any) {
          if (__DEV__) console.error('Failed to upload photo:', uploadError);
          
          // Provide more specific error messages
          let errorMessage = 'Failed to upload photo';
          if (uploadError.message) {
            errorMessage = uploadError.message;
          } else if (uploadError.response?.data?.message) {
            errorMessage = uploadError.response.data.message;
          }
          
          showToast(errorMessage, 'error', 5000);
        } finally {
          setIsSending(false);
        }
      }
    } catch (error: any) {
      if (__DEV__) console.error('Camera capture error:', error);
      showToast('Failed to capture photo. Please try again.', 'error', 3000);
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        if (__DEV__) console.log('Document selected:', selectedAsset);
        
        // Show loading state
        setIsSending(true);
        
        try {
          // Create file object for upload with proper structure
          const file = {
            uri: selectedAsset.uri,
            type: selectedAsset.mimeType || 'application/octet-stream',
            name: selectedAsset.name || `document_${Date.now()}`,
            fileSize: selectedAsset.size || 0,
          };
          
          if (__DEV__) {
            console.log('Prepared document for upload:', file);
          }
          
          // Upload the document
          const uploadResult = await chatApiService.uploadMedia(file);
          if (__DEV__) console.log('Document uploaded:', uploadResult);
          
          // Send the document message
          if (currentConversation) {
            const documentMessage: SocketMessage = {
              conversationId: currentConversation._id,
              content: '', // Optional caption
              messageType: 'file',
              mediaUrl: uploadResult.url,
              fileName: uploadResult.fileName,
              fileSize: uploadResult.fileSize,
            };
            
            // Send via WebSocket
            chatSocketService.sendMessage(documentMessage);
            
            // Show success toast
            showToast('Document sent successfully', 'success', 3000);
          }
        } catch (uploadError: any) {
          if (__DEV__) console.error('Failed to upload document:', uploadError);
          
          // Provide more specific error messages
          let errorMessage = 'Failed to upload document';
          if (uploadError.message) {
            errorMessage = uploadError.message;
          } else if (uploadError.response?.data?.message) {
            errorMessage = uploadError.response.data.message;
          }
          
          showToast(errorMessage, 'error', 5000);
        } finally {
          setIsSending(false);
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
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
      // Use the main reaction handler
      handleReactionPress(emoji, selectedMessage._id);
    }
  };

  const handleMessageEdit = (newContent: string) => {
    if (selectedMessage) {
      // TODO: Implement edit logic with socket
             if (__DEV__) console.log('Edit message:', selectedMessage._id, 'to:', newContent);
      // chatSocketService.editMessage(selectedMessage._id, newContent);
    }
  };

  const handleMessageDelete = (deleteForEveryone: boolean) => {
    if (selectedMessage && currentConversation) {
      try {
        if (__DEV__) console.log('🗑️ Deleting message:', selectedMessage._id, 'for everyone:', deleteForEveryone);
        
        // Call the socket service to delete the message (backend only supports soft delete)
        chatSocketService.deleteMessage(selectedMessage._id);
        
        // Update local state immediately for better UX
        // Since backend only supports soft delete, we always mark as deleted
        dispatch(deleteMessage({
          messageId: selectedMessage._id,
          conversationId: currentConversation._id,
          deleteForEveryone: false,
        }));
        
        // Close the message actions modal
        setShowMessageActions(false);
        setSelectedMessage(null);
        
        // Show success toast
        showToast('Message deleted', 'success', 3000);
      } catch (error) {
        console.error('❌ Error deleting message:', error);
        showToast('Failed to delete message', 'error', 3000);
      }
    }
  };

  const handleMessageReply = () => {
    if (selectedMessage) {
             if (__DEV__) console.log('Reply to message:', selectedMessage._id);
      setReplyToMessage(selectedMessage);
      setShowMessageActions(false);
      setSelectedMessage(null);
      // Focus on the input
      setTimeout(() => {
        // You can add input focus logic here if needed
      }, 100);
    }
  };

  const handleMessageForward = () => {
    if (selectedMessage) {
             if (__DEV__) console.log('Forward message:', selectedMessage._id);
      setForwardMessage(selectedMessage);
      setShowForwardModal(true);
      setShowMessageActions(false);
      setSelectedMessage(null);
    }
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const handleForwardToConversation = async (targetConversationId: string) => {
    if (!forwardMessage || !currentConversation) return;

    try {
      // Use WebSocket to forward the message
      const forwardedMessage = await chatSocketService.forwardMessage(
        forwardMessage._id,
        targetConversationId
      );
      
      // Close forward modal and clear state
      setShowForwardModal(false);
      setForwardMessage(null);
      
      // Show success message
      showToast('Message forwarded successfully', 'success');
      
      // Navigate to the target conversation if it's different
      if (targetConversationId !== currentConversation._id) {
        // You can implement navigation to the target conversation here
        if (__DEV__) console.log('Forwarded to conversation:', targetConversationId);
      }
    } catch (error: any) {
      console.error('❌ Error forwarding message:', error);
      showToast('Failed to forward message', 'error');
    }
  };

  const cancelForward = () => {
    setShowForwardModal(false);
    setForwardMessage(null);
  };

  const handleReactionPress = (emoji: string, messageId?: string) => {
    if (!currentConversation || !user) return;
    
    // Use provided messageId or fall back to selectedMessage
    const targetMessageId = messageId || selectedMessage?._id;
    if (!targetMessageId) {
      console.warn('No message ID available for reaction');
      return;
    }
    
    // Check if user already reacted with this emoji
    const targetMessage = messageId 
      ? messages[currentConversation._id]?.find(m => m._id === messageId)
      : selectedMessage;
    
    const hasReacted = targetMessage?.reactions[user._id]?.emoji === emoji;
    
    if (hasReacted) {
      // Remove reaction
             if (__DEV__) console.log('🗑️ Removing reaction for message:', targetMessageId);
      chatSocketService.reactToMessage(targetMessageId, { type: 'remove', emoji });
      dispatch(removeMessageReaction({
        messageId: targetMessageId,
        userId: user._id,
        conversationId: currentConversation._id,
      }));
    } else {
      // Find the reaction type for this emoji
      const reactionItem = REACTION_EMOJIS.find(item => item.emoji === emoji);
      if (reactionItem) {
        if (__DEV__) console.log('➕ Adding reaction for message:', targetMessageId, 'emoji:', emoji);
        chatSocketService.reactToMessage(targetMessageId, { type: reactionItem.type, emoji });
        dispatch(addMessageReaction({
          messageId: targetMessageId,
          userId: user._id,
          reactionType: 'add',
          emoji,
          conversationId: currentConversation._id,
        }));
      }
    }
    
    if (selectedMessage) {
      setShowMessageActions(false);
    }
  };

  const handleReactionLongPress = (emoji: string) => {
    // Show reaction details
           if (__DEV__) console.log('Show reaction details for:', emoji);
  };

  const openReactionPicker = (messageId: string) => {
    setReactionMessageId(messageId);
    setShowReactionPicker(true);
    setShowMessageActions(false);
  };

  const handleReactionSelect = (emoji: string, type: string) => {
    if (!currentConversation || !user || !reactionMessageId) return;
    
    // Add reaction with correct type
    chatSocketService.reactToMessage(reactionMessageId, { type, emoji });
    dispatch(addMessageReaction({
      messageId: reactionMessageId,
      userId: user._id,
      reactionType: 'add',
      emoji,
      conversationId: currentConversation._id,
    }));
    
    setShowReactionPicker(false);
    setReactionMessageId(null);
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
      
      {/* Chat Header */}
      <ChatHeader
        conversation={currentConversation}
        currentUser={user && user.name ? user as ChatUser : null}
        onShowUserInfo={() => setShowUserInfo(true)}
      />

      {/* Messages with Custom Background */}
      <View style={styles.messagesBackground}>
        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          renderItem={({ item, index }) => (
            <>
              <DateSeparator
                message={item}
                index={index}
                messages={conversationMessages}
              />
              <ChatMessageComponent
                message={item}
                index={index}
                messages={conversationMessages}
                currentUser={user && user.name ? user as ChatUser : null}
                onLongPress={handleMessageLongPress}
                onReactionPress={(emoji, messageId) => handleReactionPress(emoji, messageId)}
                onReactionLongPress={handleReactionLongPress}
              />
            </>
          )}
          keyExtractor={(item, index) => `${item._id}-${index}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={() => (
            <TypingIndicator
              typingUsers={typingUsers[currentConversation._id] || []}
              currentUserId={user?._id || null}
            />
          )}
          inverted={false}
        />
      </View>

             {/* Chat Input */}
       <ChatInput
         messageText={messageText}
         onMessageChange={handleTyping}
         onSendMessage={handleSendMessage}
         onImagePicker={handleImagePicker}
         onCameraCapture={handleCameraCapture}
         onDocumentPicker={handleDocumentPicker}
         isSending={isSending}
         inputHeightAnim={inputHeightAnim}
         sendButtonScaleAnim={sendButtonScaleAnim}
         replyToMessage={replyToMessage}
         onCancelReply={cancelReply}
       />

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
          isOwnMessage={selectedMessage.sender._id === user?._id}
          onReact={handleMessageReact}
          onEdit={handleMessageEdit}
          onDelete={handleMessageDelete}
          onReply={handleMessageReply}
          onForward={handleMessageForward}
          onShowReactionPicker={() => openReactionPicker(selectedMessage._id)}
        />
      )}

      {/* Reaction Picker Modal */}
      <ReactionPicker
        visible={showReactionPicker}
        onClose={() => setShowReactionPicker(false)}
        onReactionSelect={handleReactionSelect}
        messageId={reactionMessageId || ''}
        currentReactions={reactionMessageId ? messages[currentConversation?._id || '']?.find(m => m._id === reactionMessageId)?.reactions : {}}
        currentUserId={user?._id}
      />

      {/* Forward Modal */}
      <ForwardModal
        visible={showForwardModal}
        message={forwardMessage}
        conversations={Object.values(conversations || {}).filter(conv => conv._id !== currentConversation?._id)}
        onForward={handleForwardToConversation}
        onCancel={cancelForward}
        isLoading={isLoading}
      />
      
      {/* Toast Container for notifications */}
      <ToastContainer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ChatScreen;