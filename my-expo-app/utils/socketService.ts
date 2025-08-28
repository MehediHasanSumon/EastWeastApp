import { io, Socket } from 'socket.io-client';
import { getRefreshToken } from './authStorage';
import { API_BASE_URL } from './api';

class ChatSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners: Map<string, Function[]> = new Map();

  async connect() {
    if (this.socket && this.isConnected) return;

    const token = await getRefreshToken();
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    this.socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.isConnected = true;
      this.emit('socket_connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      this.isConnected = false;
      this.emit('socket_disconnected');
    });

    this.socket.on('new_message', (message) => {
      this.emit('new_message', message);
    });

    this.socket.on('typing_start', (data) => {
      this.emit('typing_start', data);
    });

    this.socket.on('typing_stop', (data) => {
      this.emit('typing_stop', data);
    });

    this.socket.on('message_error', (error) => {
      this.emit('message_error', error);
    });
  }

  sendMessage(data: {
    conversationId: string;
    content: string;
    messageType?: string;
    mediaUrl?: string;
    replyTo?: string;
  }) {
    if (!this.socket || !this.isConnected) {
      this.emit('message_error', { error: 'Not connected' });
      return;
    }
    this.socket.emit('send_message', data);
  }

  startTyping(conversationId: string) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId: string) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('typing_stop', { conversationId });
  }

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
      callbacks.forEach((callback) => callback(data));
    }
  }

  disconnect() {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
    this.socket = null;
    this.isConnected = false;
    this.listeners.clear();
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

const chatSocketService = new ChatSocketService();
export default chatSocketService;