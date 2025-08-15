import io from "socket.io-client";

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
  unreadCount: number;
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

  connect(user: SocketUser): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.user = user;

        this.socket = io(import.meta.env.VITE_BACKEND_HOST || "http://localhost:8000", {
          auth: { user },
          transports: ["websocket", "polling"],
          withCredentials: true,
        });

        this.socket.on("connect", () => {
          console.log("Connected to socket server");
          resolve(this.socket!);
        });

        this.socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          reject(error);
        });

        this.setupEventListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on(SOCKET_EVENTS.ERROR, (data) => {
      console.error("Socket error:", data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
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
