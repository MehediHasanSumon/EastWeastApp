import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  addMessage, 
  setTypingUser, 
  setConnectionStatus, 
  updateConversation,
  markConversationAsRead 
} from '../store/chatSlice';
import { refreshSession } from '../store/authSlice'; // Add refreshSession import
import { chatSocketService } from '../utils/chatSocket';
import { IMessage, IConversation } from '../types/chat';
import { getSocketAuthToken } from '../utils/authStorage'; // Updated to use socket auth token

interface ChatContextType {
  isConnected: boolean;
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (messageData: any) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, hydrated } = useAppSelector((state) => state.auth);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeSocket = async () => {
      // Wait for auth to be fully hydrated and user to be authenticated
      if (user && isAuthenticated && hydrated) {
        try {
          const token = await getSocketAuthToken(); // Use socket auth token (refresh token)
          if (token) {
            console.log('Initializing socket connection with refresh token');
            connectSocket(token);
          } else {
            console.warn('No refresh token available for socket connection');
            // Attempt to refresh session to get new tokens
            try {
              console.log('Attempting to refresh session to get new tokens...');
              await dispatch(refreshSession()).unwrap();
              // After refresh, try to get token again
              const newToken = await getSocketAuthToken();
              if (newToken) {
                console.log('Got new refresh token, connecting socket...');
                connectSocket(newToken);
              } else {
                console.error('Still no refresh token after session refresh');
              }
            } catch (refreshError) {
              console.error('Failed to refresh session:', refreshError);
            }
          }
        } catch (error) {
          console.error('Failed to get socket auth token:', error);
        }
      } else if (!isAuthenticated || !user) {
        // Disconnect socket if user is not authenticated
        disconnectSocket();
      }
    };

    initializeSocket();

    return () => {
      disconnectSocket();
    };
  }, [user, isAuthenticated, hydrated]); // Added isAuthenticated and hydrated to dependencies

  // Handle auth state changes and reconnect socket if needed
  useEffect(() => {
    if (user && isAuthenticated && hydrated && !isConnected) {
      // If we have valid auth but socket is not connected, try to connect
      const attemptReconnection = async () => {
        try {
          const token = await getSocketAuthToken();
          if (token) {
            console.log('Attempting to reconnect socket after auth state change...');
            connectSocket(token);
          }
        } catch (error) {
          console.error('Failed to reconnect socket:', error);
        }
      };
      
      // Small delay to ensure auth state is stable
      const timer = setTimeout(attemptReconnection, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthenticated, hydrated, isConnected]);

  const connectSocket = async (token: string) => {
    if (!token) return;

    try {
      await chatSocketService.connect(token);

      // Set up socket event listeners
      chatSocketService.on('socket_connected', () => {
        console.log('Socket connected in ChatContext');
        setIsConnected(true);
        dispatch(setConnectionStatus(true));
      });

      chatSocketService.on('socket_disconnected', () => {
        console.log('Socket disconnected in ChatContext');
        setIsConnected(false);
        dispatch(setConnectionStatus(false));
      });

      chatSocketService.on('socket_reconnected', (attemptNumber: number) => {
        console.log('Socket reconnected in ChatContext after', attemptNumber, 'attempts');
        setIsConnected(true);
        dispatch(setConnectionStatus(true));
        
        // Verify we still have valid authentication
        if (user && isAuthenticated) {
          console.log('Authentication still valid after reconnection');
        } else {
          console.warn('Authentication lost after reconnection, attempting refresh...');
          dispatch(refreshSession());
        }
      });

      chatSocketService.on('socket_max_reconnect_attempts', () => {
        console.error('Socket max reconnection attempts reached in ChatContext');
        setIsConnected(false);
        dispatch(setConnectionStatus(false));
      });

      chatSocketService.on('socket_reconnect_failed', () => {
        console.error('Socket reconnection failed in ChatContext');
        setIsConnected(false);
        dispatch(setConnectionStatus(false));
      });

      chatSocketService.on('socket_reconnect_attempt', (attemptNumber: number) => {
        console.log('Socket reconnection attempt in ChatContext:', attemptNumber);
      });

      chatSocketService.on('new_message', (message: IMessage) => {
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

      chatSocketService.on('message_delivered', (data: any) => {
        // TODO: Update message delivery status
        console.log('Message delivered:', data);
      });

      chatSocketService.on('message_read', (data: any) => {
        // TODO: Update message read status
        console.log('Message read:', data);
      });

      chatSocketService.on('user_online', (data: any) => {
        // TODO: Update user online status
        console.log('User online:', data);
      });

      chatSocketService.on('user_offline', (data: any) => {
        // TODO: Update user offline status
        console.log('User offline:', data);
      });

      chatSocketService.on('error', (error: any) => {
        console.error('Socket error:', error);
      });

      chatSocketService.on('socket_error', (error: any) => {
        console.error('Socket error in ChatContext:', error);
        
        // Log additional error details
        if (error.message) {
          console.error('Error message:', error.message);
        }
        if (error.type) {
          console.error('Error type:', error.type);
        }
        
        // Check if it's a connection error
        if (error.message && error.message.includes('xhr poll error')) {
          console.error('XHR Poll Error detected - checking server connectivity...');
          console.error('This usually means:');
          console.error('1. Server is not running');
          console.error('2. Wrong server URL');
          console.error('3. CORS issues');
          console.error('4. Network connectivity problems');
          // You could add a retry mechanism here
        }
        
        // Check for authentication-specific errors
        if (error.message && (error.message.includes('Authentication error') || error.message.includes('Unauthorized'))) {
          console.error('Authentication Error detected - checking token validity...');
          console.error('This usually means:');
          console.error('1. Invalid or expired refresh token');
          console.error('2. User not found on server');
          console.error('3. Token format is incorrect');
          console.error('4. Server authentication middleware failed');
          console.error('5. Need to refresh authentication tokens');
          dispatch(refreshSession()); // Attempt to refresh session on authentication error
        }
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

  const joinConversation = (conversationId: string) => {
    if (isConnected) {
      chatSocketService.joinConversation(conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (isConnected) {
      chatSocketService.leaveConversation(conversationId);
    }
  };

  const sendMessage = (messageData: any) => {
    if (isConnected) {
      chatSocketService.sendMessage(messageData);
    }
  };

  const startTyping = (conversationId: string) => {
    if (isConnected) {
      chatSocketService.startTyping(conversationId);
    }
  };

  const stopTyping = (conversationId: string) => {
    if (isConnected) {
      chatSocketService.stopTyping(conversationId);
    }
  };

  const value: ChatContextType = {
    isConnected,
    connectSocket,
    disconnectSocket,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
