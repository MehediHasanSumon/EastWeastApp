import io from "socket.io-client";
import { getCookie } from "../utils/Storage";
import { hexToString } from "../utils/Lib";

export interface SocketUser {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface MessageData {
  id: string;
  conversationId: string;
  sender: SocketUser;
  content: string;
  type: "text" | "image" | "file" | "note";
  metadata?: any;
  createdAt: Date;
  readBy: string[];
}

export interface ConversationData {
  id: string;
  name?: string;
  participants: SocketUser[];
  lastMessage?: MessageData;
  unreadCount: { [userId: string]: number };
  isGroup: boolean;
}

export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  JOIN_ROOM: "joinRoom",
  LEAVE_ROOM: "leaveRoom",
  SEND_MESSAGE: "sendMessage",
  NEW_MESSAGE: "newMessage",
  MESSAGE_DELIVERED: "messageDelivered",
  MESSAGE_READ: "messageRead",
  TYPING_START: "typingStart",
  TYPING_STOP: "typingStop",
  USER_TYPING: "userTyping",
  USER_ONLINE: "userOnline",
  USER_OFFLINE: "userOffline",
  ERROR: "error",
} as const;

class SocketService {
  private socket: any | null = null;
  private user: SocketUser | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(user: SocketUser): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.user = user;

        // Get authentication tokens
        const accessToken = getCookie("at_");
        const refreshToken = getCookie("rt");
        
        if (!accessToken && !refreshToken) {
          reject(new Error("No authentication tokens found"));
          return;
        }

        // Decode refresh token if needed
        const decodedRefreshToken = refreshToken ? hexToString(refreshToken) : null;

        this.socket = io(import.meta.env.VITE_BACKEND_HOST || "http://localhost:8000", {
          auth: { 
            user,
            accessToken: accessToken || decodedRefreshToken,
            refreshToken: decodedRefreshToken
          },
          transports: ["websocket", "polling"],
          withCredentials: true,
          timeout: 10000,
          forceNew: true,
        });

        this.socket.on("connect", () => {
          console.log("Connected to socket server");
          this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          resolve(this.socket!);
        });

        this.socket.on("connect_error", (error: any) => {
          console.error("Socket connection error:", error);
          
          // Handle authentication errors specifically
          if (error.message === "Authentication error" || error.data?.message === "Authentication error") {
            console.log("Authentication failed, will retry after token refresh");
            // Don't reject immediately for auth errors, let the app handle token refresh
            setTimeout(() => {
              this.attemptReconnect(resolve, reject);
            }, 2000);
          } else {
            // For other errors, attempt reconnection
            this.attemptReconnect(resolve, reject);
          }
        });

        this.socket.on("disconnect", (reason: string) => {
          console.log("Socket disconnected:", reason);
          if (reason === "io server disconnect") {
            // Server disconnected, try to reconnect
            this.attemptReconnect(resolve, reject);
          }
        });

        this.setupEventListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(resolve: any, reject: any) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      reject(new Error("Max reconnection attempts reached"));
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (this.user) {
        this.connect(this.user)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error("No user data for reconnection"));
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on(SOCKET_EVENTS.ERROR, (data: any) => {
      console.error("Socket error:", data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.user = null;
    this.reconnectAttempts = 0;
  }

  // Room Management
  joinRoom(conversationId: string) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, { conversationId });
    }
  }

  leaveRoom(conversationId: string) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { conversationId });
    }
  }

  // Message Operations
  sendMessage(data: { conversationId: string; content: string; type: "text" | "image" | "file" | "note"; metadata?: any }) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.SEND_MESSAGE, data);
    }
  }

  markMessageAsRead(conversationId: string, messageId: string) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.MESSAGE_READ, { conversationId, messageId });
    }
  }

  // Typing Indicators
  startTyping(conversationId: string) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.TYPING_START, { conversationId });
    }
  }

  stopTyping(conversationId: string) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
    }
  }

  // Event Listeners
  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
