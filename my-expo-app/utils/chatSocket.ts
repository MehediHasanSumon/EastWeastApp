import { io, Socket } from 'socket.io-client';
import { getRefreshToken } from './authStorage';
import { ChatMessage, SocketMessage, TypingUser, CallInvite, CallType } from '../types/chat';
import Constants from 'expo-constants';

// Configure socket URL for different environments
function getSocketUrl(): string {
  // Try to get from app config first (for production builds)
  const appConfig = Constants.expoConfig?.extra;
  const envSocketUrl = appConfig?.EXPO_PUBLIC_SOCKET_URL || process.env.EXPO_PUBLIC_SOCKET_URL;
  const envBackendHost = appConfig?.EXPO_PUBLIC_BACKEND_HOST || process.env.EXPO_PUBLIC_BACKEND_HOST || process.env.BACKEND_HOST;
  
  // Production environment
  if (process.env.NODE_ENV === 'production' || appConfig?.NODE_ENV === 'production') {
    return envSocketUrl || 'https://your-production-domain.com';
  }
  
  // Development environment - use the same logic as API
  if (envBackendHost) return envBackendHost;
  
  // Default to localhost for development
  return 'http://10.0.2.2:8000';
}

class ChatSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  async connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    const token = await getRefreshToken();
    if (!token) {
      console.error('No refresh token available for socket connection');
      return;
    }

    const socketUrl = getSocketUrl();
    console.log('Connecting to socket server:', socketUrl);

    this.socket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      // Add timeout for production
      timeout: 20000,
      // Add force new connection for better reliability
      forceNew: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('socket_connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      this.isConnected = false;
      this.emit('socket_disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Chat events
    this.socket.on('new_message', (message: ChatMessage) => {
      this.emit('new_message', message);
    });

    this.socket.on('message_edited', (data: { messageId: string; content: string }) => {
      this.emit('message_edited', data);
    });

    this.socket.on('message_deleted', (data: { messageId: string }) => {
      this.emit('message_deleted', data);
    });

    this.socket.on('message_reaction', (data: { messageId: string; userId: string; reaction: any }) => {
      this.emit('message_reaction', data);
    });

    this.socket.on('typing_start', (data: { conversationId: string; userId: string; userName: string }) => {
      this.emit('typing_start', data);
    });

    this.socket.on('typing_stop', (data: { conversationId: string; userId: string }) => {
      this.emit('typing_stop', data);
    });

    this.socket.on('user_presence', (data: { userId: string; status: 'online' | 'offline' | 'away' }) => {
      this.emit('user_presence', data);
    });

    this.socket.on('message_delivered', (data: { messageId: string; userId: string }) => {
      this.emit('message_delivered', data);
    });

    this.socket.on('message_read', (data: { messageId: string; userId: string }) => {
      this.emit('message_read', data);
    });

    this.socket.on('unread_counts_updated', (data: { conversationId: string }) => {
      this.emit('unread_counts_updated', data);
    });

    this.socket.on('conversation_updated', (data: { conversation: any }) => {
      this.emit('conversation_updated', data);
    });

    // Call events
    this.socket.on('call_invite', (data: CallInvite) => {
      this.emit('call_invite', data);
    });

    this.socket.on('call_accepted', (data: { conversationId: string; fromUserId: string }) => {
      this.emit('call_accepted', data);
    });

    this.socket.on('call_rejected', (data: { conversationId: string; fromUserId: string; reason: string }) => {
      this.emit('call_rejected', data);
    });

    this.socket.on('call_cancelled', (data: { conversationId: string; fromUserId: string }) => {
      this.emit('call_cancelled', data);
    });

    this.socket.on('call_ended', (data: { conversationId: string; fromUserId: string }) => {
      this.emit('call_ended', data);
    });

    this.socket.on('webrtc_signal', (data: { conversationId: string; signal: any }) => {
      this.emit('webrtc_signal', data);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  // Join a conversation room
  joinConversation(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  // Send a message
  sendMessage(messageData: SocketMessage): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      this.socket.emit('send_message', messageData, (response: any) => {
        resolve(response);
      });
    });
  }

  // Start typing indicator
  startTyping(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { conversationId });
    }
  }

  // Stop typing indicator
  stopTyping(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { conversationId });
    }
  }

  // Mark message as read
  markMessageAsRead(messageId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_as_read', { messageId });
    }
  }

  // Mark conversation as read
  markConversationAsRead(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_as_read', { conversationId });
    }
  }

  // React to a message
  reactToMessage(messageId: string, reaction: { type: string; emoji: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message_reaction', { messageId, reaction });
    }
  }

  // Edit a message
  editMessage(messageId: string, content: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('edit_message', { messageId, content });
    }
  }

  // Delete a message
  deleteMessage(messageId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('delete_message', { messageId });
    }
  }

  // Call-related methods
  inviteToCall(conversationId: string, callType: CallType) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('call_invite', { conversationId, callType });
  }

  acceptCall(conversationId: string) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('call_accepted', { conversationId });
  }

  rejectCall(conversationId: string, reason: string = 'declined') {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('call_rejected', { conversationId, reason });
  }

  cancelCall(conversationId: string) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('call_cancelled', { conversationId });
  }

  endCall(conversationId: string) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('call_ended', { conversationId });
  }

  sendWebRTCSignal(conversationId: string, signal: any) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('webrtc_signal', { conversationId, signal });
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const chatSocketService = new ChatSocketService();
