import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import { ChatService, type IConversation } from '../service/chatService';
import type { RootState } from '../app/Store';

export const useUnreadMessages = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { isConnected } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total unread count from conversations
  const calculateUnreadCount = useCallback((conversations: IConversation[]) => {
    if (!user) return 0;
    
    return conversations.reduce((total, conversation) => {
      const userUnreadCount = conversation.unreadCount?.[user._id || user.id] || 0;
      return total + userUnreadCount;
    }, 0);
  }, [user]);

  // Load conversations and calculate unread count
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const conversationsData = await ChatService.getConversations();
      setConversations(conversationsData);
      
      const totalUnread = calculateUnreadCount(conversationsData);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, calculateUnreadCount]);

  // Update unread count when conversations change
  useEffect(() => {
    const totalUnread = calculateUnreadCount(conversations);
    setUnreadCount(totalUnread);
  }, [conversations, calculateUnreadCount]);

  // Load conversations on mount and when user changes
  useEffect(() => {
    if (user && isConnected) {
      loadConversations();
    }
  }, [user, isConnected, loadConversations]);

  // Function to mark conversation as read (reset unread count)
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      // Update local state immediately for better UX
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId 
            ? { 
                ...conv, 
                unreadCount: { 
                  ...conv.unreadCount, 
                  [user?._id || user?.id || '']: 0 
                } 
              }
            : conv
        )
      );
      
      // You might want to call an API to mark messages as read
      // await ChatService.markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [user]);

  // Function to reset all unread counts
  const resetAllUnreadCounts = useCallback(() => {
    setConversations(prev => 
      prev.map(conv => ({
        ...conv,
        unreadCount: { ...conv.unreadCount }
      }))
    );
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    conversations,
    isLoading,
    loadConversations,
    markConversationAsRead,
    resetAllUnreadCounts,
  };
};
