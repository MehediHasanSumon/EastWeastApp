import request from "./AxiosInstance";

export interface IConversation {
  _id: string;
  participants: IUser[];
  type: "direct" | "group";
  name?: string;
  avatar?: string;
  admins?: IUser[];
  lastMessage?: IMessage;
  lastMessageTime?: string;
  unreadCount?: { [userId: string]: number };
  mutedBy?: { [userId: string]: boolean };
  blockedBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  sender: IUser;
  content: string;
  messageType: "text" | "image" | "file" | "voice" | "video";
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  replyTo?: IMessage;
  reactions: {
    [userId: string]: {
      type: string;
      emoji: string;
    };
  };
  readBy: string[];
  deliveredTo: string[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  presence?: {
    isOnline: boolean;
    lastSeen: string;
  };
}

export interface IUserPresence {
  _id: string;
  userId: IUser;
  isOnline: boolean;
  lastSeen: string;
  socketId?: string;
  deviceInfo?: {
    userAgent: string;
    ip: string;
  };
}

export class ChatService {
  // Conversations
  static async getConversations(): Promise<IConversation[]> {
    const response = await request.get("/api/chat/conversations");
    return response.data.data;
  }

  static async createConversation(data: {
    participants: string[];
    type: "direct" | "group";
    name?: string;
    avatar?: string;
  }): Promise<IConversation> {
    const response = await request.post("/api/chat/conversations", data);
    return response.data.data;
  }

  static async getConversation(conversationId: string): Promise<IConversation> {
    const response = await request.get(`/api/chat/conversations/${conversationId}`);
    return response.data.data;
  }

  static async updateConversation(conversationId: string, data: { name?: string; avatar?: string }): Promise<IConversation> {
    const response = await request.put(`/api/chat/conversations/${conversationId}`, data);
    return response.data.data;
  }

  static async manageParticipants(
    conversationId: string,
    data: { action: "add" | "remove"; participantIds: string[] }
  ): Promise<IConversation> {
    const response = await request.post(`/api/chat/conversations/${conversationId}/participants`, data);
    return response.data.data;
  }

  // Admin management (group only)
  static async updateAdmins(
    conversationId: string,
    data: { action: "add" | "remove"; memberId: string }
  ): Promise<IConversation> {
    const response = await request.put(`/api/chat/conversations/${conversationId}/admins`, data);
    return response.data.data;
  }

  // Messages
  static async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    data: IMessage[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalMessages: number;
      hasMore: boolean;
    };
  }> {
    const response = await request.get(`/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Users
  static async getOnlineUsers(): Promise<IUserPresence[]> {
    const response = await request.get("/api/chat/users/online");
    return response.data.data;
  }

  static async searchUsers(query: string): Promise<IUser[]> {
    const response = await request.get(`/api/chat/users/search?query=${encodeURIComponent(query)}`);
    return response.data.data;
  }

  // Media upload
  static async uploadMedia(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{
    url: string;
    publicId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    messageType: "image" | "file" | "voice";
  }> {
    const formData = new FormData();
    formData.append("file", file);
    // Important: let the browser set the correct multipart boundary automatically.
    const response = await request.post("/api/chat/media", formData, {
      onUploadProgress: (evt) => {
        if (!onProgress || !evt.total) return;
        const pct = Math.round((evt.loaded * 100) / evt.total);
        onProgress(pct);
      },
    });
    return response.data.data;
  }

  // Mute/Unmute conversation
  static async muteConversation(conversationId: string, mute: boolean): Promise<{ muted: boolean }> {
    const response = await request.put(`/api/chat/conversations/${conversationId}/mute`, { mute });
    return response.data.data;
  }

  // Block/Unblock user (for direct conversations)
  static async blockUser(conversationId: string, block: boolean): Promise<{ blocked: boolean }> {
    const response = await request.put(`/api/chat/conversations/${conversationId}/block`, { block });
    return response.data.data;
  }

  // Leave group conversation
  static async leaveGroup(conversationId: string): Promise<void> {
    await request.post(`/api/chat/conversations/${conversationId}/leave`);
  }

  static async deleteConversation(conversationId: string): Promise<void> {
    await request.delete(`/api/chat/conversations/${conversationId}`);
  }

  // Conversation media (images/files)
  static async getConversationMedia(
    conversationId: string,
    type: "all" | "image" | "file" = "all",
    page: number = 1,
    limit: number = 24
  ): Promise<{
    data: Array<Pick<IMessage, "mediaUrl" | "fileName" | "fileSize" | "messageType" | "createdAt"> & { sender: IUser }>;
    pagination: { currentPage: number; totalPages: number; total: number; hasMore: boolean };
  }> {
    const response = await request.get(
      `/api/chat/conversations/${conversationId}/media?type=${type}&page=${page}&limit=${limit}`
    );
    return response.data;
  }
}
