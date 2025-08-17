import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { chatSocketService } from '../utils/chatSocket';
import { addMessage, setTypingUser, setConnectionStatus, updateConversation } from '../store/chatSlice';
import { ChatMessage } from '../types/chat';

interface ChatContextType {
  isConnected: boolean;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user]);

  const connectSocket = async () => {
    if (!user) return;

    try {
      await chatSocketService.connect();

      // Set up socket event listeners
      chatSocketService.on('socket_connected', () => {
        setIsConnected(true);
        dispatch(setConnectionStatus(true));
      });

      chatSocketService.on('socket_disconnected', () => {
        setIsConnected(false);
        dispatch(setConnectionStatus(false));
      });

      chatSocketService.on('new_message', (message: ChatMessage) => {
        dispatch(addMessage(message));
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
        dispatch(updateConversation(data.conversation));
      });

      chatSocketService.on('error', (error: any) => {
        console.error('Socket error:', error);
      });
    } catch (error) {
      console.error('Failed to connect to socket:', error);
    }
  };

  const disconnectSocket = () => {
    chatSocketService.disconnect();
    setIsConnected(false);
    dispatch(setConnectionStatus(false));
  };

  const value: ChatContextType = {
    isConnected,
    connectSocket,
    disconnectSocket,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
