import { io, Socket } from 'socket.io-client';
import { IMessage, ISocketMessage, ITypingData } from '../types/chat';
import { getSocketUrl } from '../config/environment';

class ChatSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();
  private authToken: string | null = null;

  // Event listeners
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

  emit(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  connect(token?: string) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected, skipping connection attempt');
      return;
    }

    if (token) {
      this.authToken = token;
      console.log('Refresh token set for socket connection');
    }

    if (!this.authToken) {
      console.error('No refresh token found for socket connection');
      return;
    }

    // Avoid duplicate connection attempts
    if (this.socket && (this.socket.connected || (this.socket as any).active)) {
      console.log('Socket connection already active, skipping connection attempt');
      return;
    }

    try {
      // Use environment configuration for socket URL
      const socketUrl = getSocketUrl();
      console.log('Connecting to socket server:', socketUrl);
      console.log('Using refresh token for authentication:', this.authToken ? 'Present' : 'Missing');
      
      this.socket = io(socketUrl, {
        auth: { 
          token: this.authToken, // Send refresh token in auth object (like web app)
        },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: false,
        autoConnect: true,
      });

      this.setupEventListeners();
      console.log('Socket connection setup completed');
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      this.triggerListeners('socket_error', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      console.log('Socket ID:', this.socket?.id);
      console.log('Socket transport:', this.socket?.io?.engine?.transport?.name);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.triggerListeners('socket_connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.triggerListeners('socket_disconnected', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        console.log('Server disconnected us, attempting to reconnect...');
        this.socket?.connect();
      } else if (reason === 'io client disconnect') {
        console.log('Client initiated disconnect');
      } else if (reason === 'transport close') {
        console.log('Transport closed');
      } else if (reason === 'transport error') {
        console.log('Transport error occurred');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.triggerListeners('socket_error', error);
      
      // Log additional connection details for debugging
      console.log('Socket connection details:', {
        url: this.socket?.io?.uri,
        auth: this.authToken ? 'Refresh token present' : 'No refresh token',
        transports: this.socket?.io?.opts?.transports,
        errorMessage: error.message,
        errorType: error.type,
      });
      
      // Try to get more specific error information
      if (error.message.includes('xhr poll error')) {
        console.error('XHR Poll Error - This usually means:');
        console.error('1. Server is not running');
        console.error('2. Wrong server URL');
        console.error('3. CORS issues');
        console.error('4. Network connectivity problems');
      }
      
      // Check for authentication-specific errors
      if (error.message.includes('Authentication error') || error.message.includes('Unauthorized')) {
        console.error('Authentication Error - This usually means:');
        console.error('1. Invalid or expired refresh token');
        console.error('2. User not found on server');
        console.error('3. Token format is incorrect');
        console.error('4. Server authentication middleware failed');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.triggerListeners('socket_reconnected', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.triggerListeners('socket_max_reconnect_attempts');
      }
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      this.triggerListeners('socket_reconnect_failed');
    });

    // Chat-specific events
    this.socket.on('new_message', (message: IMessage) => {
      console.log('New message received:', message);
      this.triggerListeners('new_message', message);
    });

    this.socket.on('message_delivered', (data: { messageId: string; conversationId: string }) => {
      console.log('Message delivered:', data);
      this.triggerListeners('message_delivered', data);
    });

    this.socket.on('message_read', (data: { messageId: string; conversationId: string; userId: string }) => {
      console.log('Message read:', data);
      this.triggerListeners('message_read', data);
    });

    this.socket.on('typing_start', (data: ITypingData) => {
      console.log('Typing started:', data);
      this.triggerListeners('typing_start', data);
    });

    this.socket.on('typing_stop', (data: ITypingData) => {
      console.log('Typing stopped:', data);
      this.triggerListeners('typing_stop', data);
    });

    this.socket.on('conversation_updated', (data: { conversation: any }) => {
      console.log('Conversation updated:', data);
      this.triggerListeners('conversation_updated', data);
    });

    this.socket.on('user_online', (data: { userId: string; userName: string }) => {
      console.log('User online:', data);
      this.triggerListeners('user_online', data);
    });

    this.socket.on('user_offline', (data: { userId: string; userName: string }) => {
      console.log('User offline:', data);
      this.triggerListeners('user_offline', data);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.triggerListeners('error', error);
    });
  }

  private triggerListeners(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket listener for event ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  // Chat-specific methods
  joinConversation(conversationId: string) {
    this.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.emit('leave_conversation', { conversationId });
  }

  sendMessage(messageData: ISocketMessage) {
    this.emit('send_message', messageData);
  }

  startTyping(conversationId: string) {
    this.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.emit('typing_stop', { conversationId });
  }

  markConversationAsRead(conversationId: string) {
    this.emit('mark_conversation_read', { conversationId });
  }

  markMessageAsRead(messageId: string, conversationId: string) {
    this.emit('mark_message_read', { messageId, conversationId });
  }

  // Utility methods
  getConnectionStatus() {
    return this.isConnected;
  }

  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
export const chatSocketService = new ChatSocketService();
export default chatSocketService;
