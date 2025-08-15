import { io, Socket } from "socket.io-client";
import { getCookie } from "../utils/Storage";
import { hexToString } from "../utils/Lib";

class ChatSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  // Queue read events to avoid errors when offline
  private pendingReadMessageIds: Set<string> = new Set();
  private pendingReadConversationIds: Set<string> = new Set();

  // Event listeners
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    const token = getCookie("rt");
    const authToken = hexToString(token as string);

    if (!authToken) {
      console.error("No authentication token found");
      return;
    }

    // Avoid duplicate connection attempts
    if (this.socket && (this.socket.connected || (this.socket as any).active)) {
      return;
    }

    this.socket = io("http://localhost:8000", {
      auth: { token: authToken },
      // Start with polling to avoid benign dev warning when closing before WS is up
      transports: ["polling", "websocket"],
      // Rely on built-in reconnection instead of manual reconnect loop
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Connected to chat server");
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit("socket_connected");
      // Flush pending read acknowledgements
      try {
        if (this.pendingReadConversationIds.size) {
          this.pendingReadConversationIds.forEach((convId) => {
            try { this.socket!.emit("mark_as_read", { conversationId: convId }); } catch {}
          });
          this.pendingReadConversationIds.clear();
        }
        if (this.pendingReadMessageIds.size) {
          this.pendingReadMessageIds.forEach((msgId) => {
            try { this.socket!.emit("mark_as_read", { messageId: msgId }); } catch {}
          });
          this.pendingReadMessageIds.clear();
        }
      } catch {}
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
      this.isConnected = false;
      this.emit("socket_disconnected");
    });

    this.socket.on("connect_error", (error) => {
      // Let Socket.IO built-in reconnection handle retry; keep console noise minimal
      console.debug("Socket connect_error", error?.message || error);
    });

    // Chat events
    this.socket.on("new_message", (message) => {
      this.emit("new_message", message);
    });

    this.socket.on("message_edited", (data) => {
      this.emit("message_edited", data);
    });

    this.socket.on("message_deleted", (data) => {
      this.emit("message_deleted", data);
    });

    this.socket.on("message_reaction", (data) => {
      this.emit("message_reaction", data);
    });

    this.socket.on("typing_start", (data) => {
      this.emit("typing_start", data);
    });

    this.socket.on("typing_stop", (data) => {
      this.emit("typing_stop", data);
    });

    this.socket.on("user_presence", (data) => {
      this.emit("user_presence", data);
    });

    // Unread counters updated
    this.socket.on("unread_counts_updated", (data) => {
      this.emit("unread_counts_updated", data);
    });

    // Error events
    this.socket.on("message_error", (error) => {
      this.emit("message_error", error);
    });

    this.socket.on("reaction_error", (error) => {
      this.emit("reaction_error", error);
    });

    this.socket.on("edit_error", (error) => {
      this.emit("edit_error", error);
    });

    this.socket.on("delete_error", (error) => {
      this.emit("delete_error", error);
    });
    this.socket.on("read_error", (error) => {
      this.emit("read_error", error);
    });

    // WebRTC signaling events
    this.socket.on("call_invite", (data) => this.emit("call_invite", data));
    this.socket.on("call_cancelled", (data) => this.emit("call_cancelled", data));
    this.socket.on("call_accepted", (data) => this.emit("call_accepted", data));
    this.socket.on("call_rejected", (data) => this.emit("call_rejected", data));
    this.socket.on("webrtc_signal", (data) => this.emit("webrtc_signal", data));
  }

  // Removed manual reconnect; rely on Socket.IO built-in reconnection

  // Send message
  sendMessage(data: {
    conversationId: string;
    content: string;
    messageType?: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    replyTo?: string;
  }) {
    if (!this.socket || !this.isConnected) {
      this.emit("message_error", { error: "Not connected" });
      return;
    }
    this.socket.emit("send_message", data, (ack: any) => {
      if (!ack?.success) {
        this.emit("message_error", { error: ack?.error || "Failed to send message" });
      }
    });
  }

  // Typing indicators
  startTyping(conversationId: string) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit("typing_start", { conversationId });
  }

  stopTyping(conversationId: string) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit("typing_stop", { conversationId });
  }

  // Message reactions
  reactToMessage(messageId: string, reactionType: string, emoji: string) {
    if (!this.socket || !this.isConnected) {
      throw new Error("Socket not connected");
    }
    this.socket.emit("react_to_message", { messageId, reactionType, emoji });
  }

  // Mark message as read
  markAsRead(messageId: string) {
    if (!this.socket || !this.isConnected) {
      this.pendingReadMessageIds.add(messageId);
      return;
    }
    try {
      this.socket.emit("mark_as_read", { messageId });
    } catch {
      this.pendingReadMessageIds.add(messageId);
    }
  }

  // Mark entire conversation as read
  markConversationAsRead(conversationId: string) {
    if (!this.socket || !this.isConnected) {
      this.pendingReadConversationIds.add(conversationId);
      return;
    }
    try {
      this.socket.emit("mark_as_read", { conversationId });
    } catch {
      this.pendingReadConversationIds.add(conversationId);
    }
  }

  // Edit message
  editMessage(messageId: string, content: string) {
    if (!this.socket || !this.isConnected) {
      throw new Error("Socket not connected");
    }
    this.socket.emit("edit_message", { messageId, content });
  }

  // Delete message
  deleteMessage(messageId: string) {
    if (!this.socket || !this.isConnected) {
      throw new Error("Socket not connected");
    }
    this.socket.emit("delete_message", { messageId });
  }

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

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // Disconnect
  disconnect() {
    if (!this.socket) return;
    // Only actively disconnect if we are connected; otherwise avoid benign warning
    if (this.socket.connected) {
      this.socket.disconnect();
    }
    this.socket = null;
    this.isConnected = false;
    this.listeners.clear();
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // --- WebRTC signaling API ---
  inviteToCall(payload: {
    conversationId: string;
    callType: "audio" | "video";
  }) {
    if (!this.socket || !this.isConnected) throw new Error("Socket not connected");
    this.socket.emit("call_invite", payload);
  }

  cancelCall(payload: { conversationId: string }) {
    if (!this.socket || !this.isConnected) throw new Error("Socket not connected");
    this.socket.emit("call_cancelled", payload);
  }

  acceptCall(payload: { conversationId: string }) {
    if (!this.socket || !this.isConnected) throw new Error("Socket not connected");
    this.socket.emit("call_accepted", payload);
  }

  rejectCall(payload: { conversationId: string; reason?: string }) {
    if (!this.socket || !this.isConnected) throw new Error("Socket not connected");
    this.socket.emit("call_rejected", payload);
  }

  sendWebRTCSignal(payload: {
    conversationId: string;
    signal: any; // SDP or ICE
  }) {
    if (!this.socket || !this.isConnected) throw new Error("Socket not connected");
    this.socket.emit("webrtc_signal", payload);
  }

  joinCallRoom(conversationId: string) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit("join_call_room", { conversationId });
  }
}

// Create singleton instance
const chatSocketService = new ChatSocketService();

export default chatSocketService;
