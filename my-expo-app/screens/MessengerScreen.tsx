import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  fetchConversations, 
  setCurrentConversation,
  addMessage,
  addMessageReaction,
  addSelectedUser,
  clearError,
  clearSelectedUsers,
  createConversation,
  deleteMessage,
  fetchMessages,
  removeSelectedUser,
  setTypingUser,
  updateMessage,
} from '../store/chatSlice';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';
import { IConversation, IMessage } from '../types/chat';
import { chatSocketService } from '../utils/chatSocket';
import ConversationList from '../components/Chat/ConversationList';
import ChatInterface from '../components/Chat/ChatInterface';
import { useChat } from '../context/ChatContext';

const { width, height } = Dimensions.get('window');

const MessengerScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useContext(ThemeContext);
  const { user } = useAppSelector((state) => state.auth);
  const { 
    conversations, 
    currentConversation, 
    messages, 
    loading, 
    error, 
    typingUsers, 
    selectedUsers, 
    searchResults, 
    pagination 
  } = useAppSelector((state) => state.chat);
  
  const { isConnected, joinConversation, leaveConversation } = useChat();
  
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const socketInitialized = useRef(false);

  const unreadTotal = React.useMemo(() => {
    const uid = user?.id || (user as any)?._id;
    if (!uid) return 0;
    return conversations.reduce((sum, c) => sum + (c.unreadCount?.[uid] || 0), 0);
  }, [conversations, user]);

  // Live refs to avoid stale closures in socket listeners
  const conversationsRef = useRef(conversations);
  const currentConversationRef = useRef(currentConversation);
  const currentUserIdRef = useRef<string | undefined>(user?.id || (user as any)?._id);

  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { currentConversationRef.current = currentConversation; }, [currentConversation]);
  useEffect(() => { currentUserIdRef.current = user?.id || (user as any)?._id; }, [user]);

  // Initialize socket connection
  useEffect(() => {
    if (!socketInitialized.current && user && isConnected) {
      socketInitialized.current = true;

      // Set up socket event listeners
      chatSocketService.on('new_message', (message: any) => {
        dispatch(addMessage(message));

        // Ensure typing indicator clears when a message arrives from a user
        try {
          if (message?.conversationId && message?.sender?._id) {
            dispatch(
              setTypingUser({
                conversationId: message.conversationId,
                userId: message.sender._id,
                isTyping: false,
              })
            );
          }
        } catch {}

        const convList = conversationsRef.current || [];
        const activeConv = currentConversationRef.current;
        const uid = currentUserIdRef.current;

        // Safety
        if (!uid) return;

        const conversation = convList.find((c) => c._id === message.conversationId);
        const isMuted = !!conversation?.mutedBy?.[uid];
        const isOwn = message?.sender?._id === uid;
        const isActive = activeConv?._id === message.conversationId;

        // If active, immediately mark as read to keep unread count accurate
        if (isActive) {
          try { 
            chatSocketService.markConversationAsRead(message.conversationId); 
          } catch {}
        }
      });

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

      chatSocketService.on('conversation_updated', (data: any) => {
        // Handle conversation updates
        console.log('Conversation updated:', data);
      });

      chatSocketService.on('error', (error: any) => {
        console.error('Socket error:', error);
      });
    }
  }, [user, isConnected, dispatch]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages();
      joinConversation(currentConversation._id);
    } else {
      // Leave previous conversation if any
      if (conversations.length > 0) {
        leaveConversation(conversations[0]._id);
      }
    }

    return () => {
      if (currentConversation) {
        leaveConversation(currentConversation._id);
      }
    };
  }, [currentConversation]);

  const loadConversations = async () => {
    try {
      console.log('🔍 Loading conversations...');
      console.log('🔍 User:', user);
      console.log('🔍 User ID:', user?.id || user?._id);
      
      const result = await dispatch(fetchConversations()).unwrap();
      console.log('✅ Conversations loaded successfully:', result);
      console.log('✅ Number of conversations:', result.length);
      
      if (result.length === 0) {
        console.log('⚠️ No conversations found - this might be normal for new users');
      }
    } catch (error: any) {
      console.error('❌ Failed to load conversations:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      });
    }
  };

  const loadMessages = async () => {
    if (!currentConversation) return;
    
    try {
      await dispatch(fetchMessages({ 
        conversationId: currentConversation._id,
        page: 1,
        limit: 20
      })).unwrap();
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleConversationSelect = (conversation: IConversation) => {
    dispatch(setCurrentConversation(conversation));
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleSendMessage = async (content: string, messageType = 'text', mediaUrl?: string, durationSeconds?: number, replyToId?: string) => {
    if (!currentConversation) return;

    const messageData = {
      conversationId: currentConversation._id,
      content,
      messageType,
      mediaUrl,
      duration: durationSeconds,
      replyTo: replyToId,
    };

    try {
      // Send via socket
      chatSocketService.sendMessage(messageData);
      
      // Optimistically add message to state
      const optimisticMessage: IMessage = {
        _id: Date.now().toString(),
        content,
        messageType,
        sender: { _id: user?.id || user?._id || 'currentUser', name: user?.name || 'You', email: user?.email || '' } as any,
        conversationId: currentConversation._id,
        timestamp: new Date(),
        readBy: [],
        replyTo: replyToId ? messages.find(m => m._id === replyToId) : undefined,
        mediaUrl,
        duration: durationSeconds,
      };

      dispatch(addMessage(optimisticMessage));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!currentConversation) return;

    if (isTyping) {
      chatSocketService.startTyping(currentConversation._id);
    } else {
      chatSocketService.stopTyping(currentConversation._id);
    }
  };

  const handleMessageReaction = (messageId: string, reactionType: string, emoji: string) => {
    // TODO: Implement message reaction
    console.log('Message reaction:', { messageId, reactionType, emoji });
  };

  const handleMessageEdit = (messageId: string, content: string) => {
    // TODO: Implement message edit
    console.log('Message edit:', { messageId, content });
  };

  const handleMessageDelete = (messageId: string) => {
    dispatch(deleteMessage(messageId));
  };

  const handleMarkAsRead = (messageId: string) => {
    // TODO: Implement mark as read
    console.log('Mark as read:', messageId);
  };

  const handleLoadOlder = async () => {
    if (!currentConversation || !pagination.hasMore) return;

    try {
      await dispatch(fetchMessages({ 
        conversationId: currentConversation._id,
        page: pagination.page + 1,
        limit: pagination.limit
      })).unwrap();
    } catch (error) {
      console.error('Failed to load older messages:', error);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
        <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
        {/* TODO: Show login prompt */}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {currentConversation ? (
        <ChatInterface
          conversation={currentConversation}
          messages={messages}
          typingUsers={typingUsers}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onMessageReaction={handleMessageReaction}
          onMessageEdit={handleMessageEdit}
          onMessageDelete={handleMessageDelete}
          onMarkAsRead={handleMarkAsRead}
          currentUser={user}
          onToggleSidebar={handleToggleSidebar}
          onLoadOlder={handleLoadOlder}
          hasMoreOlder={pagination.hasMore}
          isLoadingOlder={loading}
        />
      ) : (
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversation?._id}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          isLoading={loading}
          onRefresh={loadConversations}
          refreshing={loading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MessengerScreen;
