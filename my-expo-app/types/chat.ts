export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface IMessage {
  _id: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'voice';
  sender: IUser;
  conversationId: string;
  timestamp: Date;
  readBy: string[];
  replyTo?: IMessage;
  reactions?: Array<{
    type: string;
    emoji: string;
    userId: string;
    userName: string;
  }>;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
}

export interface IConversation {
  _id: string;
  participants: IUser[];
  lastMessage?: IMessage;
  unreadCount: { [userId: string]: number };
  isOnline: boolean;
  type: 'direct' | 'group';
  name?: string; // For group conversations
  avatar?: string; // For group conversations
  createdAt: Date;
  updatedAt: Date;
  mutedBy?: { [userId: string]: boolean };
  pinnedBy?: { [userId: string]: boolean };
}

export interface IChatState {
  conversations: IConversation[];
  currentConversation: IConversation | null;
  messages: IMessage[];
  typingUsers: string[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  selectedUsers: IUser[];
  searchResults: IUser[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ISocketMessage {
  conversationId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'voice';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  replyTo?: string;
}

export interface ITypingData {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface IMessageReaction {
  messageId: string;
  reactionType: string;
  emoji: string;
}

export interface IMessageEdit {
  messageId: string;
  content: string;
}

export interface IMessageDelete {
  messageId: string;
}

export interface IConversationUpdate {
  conversation: IConversation;
}

export interface INewConversation {
  participants: string[];
  type: 'direct' | 'group';
  name?: string;
}

export interface IConversationResponse {
  success: boolean;
  conversation?: IConversation;
  message?: string;
}

export interface IMessagesResponse {
  success: boolean;
  messages?: IMessage[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ISendMessageResponse {
  success: boolean;
  message?: IMessage;
  messageId?: string;
  message?: string;
}
