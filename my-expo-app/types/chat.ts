export interface ChatUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  online?: boolean;
  verified?: boolean;
  presence?: {
    status: 'online' | 'offline' | 'away';
    lastSeen?: Date;
  };
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  sender: ChatUser;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'voice' | 'video';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  }>;
  replyTo?: ChatMessage;
  status?: 'sent' | 'delivered' | 'read';
  reactions: {
    [userId: string]: {
      type: string;
      emoji: string;
      timestamp: string;
    };
  };
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  canEdit: boolean;
  canDelete: boolean;
  readBy: string[];
  deliveredTo: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  messageId: string;
  userId: string;
  type: string;
  emoji: string;
  timestamp: string;
}

export interface MessageEditData {
  messageId: string;
  newContent: string;
  conversationId: string;
}

export interface MessageDeleteData {
  messageId: string;
  conversationId: string;
  deleteForEveryone: boolean;
}

export interface ChatConversation {
  _id: string;
  participants: ChatUser[];
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  admins?: ChatUser[];
  lastMessage?: ChatMessage;
  lastMessageTime?: string;
  unreadCount?: { [userId: string]: number };
  mutedBy?: { [userId: string]: boolean };
  blockedBy?: string[];
  deletedBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TypingUser {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface SocketMessage {
  conversationId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'voice' | 'video';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  replyTo?: string;
}

export interface ChatState {
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  messages: { [conversationId: string]: ChatMessage[] };
  typingUsers: { [conversationId: string]: TypingUser[] };
  onlineUsers: string[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

export interface ChatApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalMessages: number;
    hasMore: boolean;
  };
}

// Call-related types
export type CallType = 'audio' | 'video';

export interface CallInvite {
  conversationId: string;
  fromUserId: string;
  callType: CallType;
  at: string;
}

export interface CallSignal {
  type: 'sdp' | 'ice';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface CallState {
  isIncoming: boolean;
  isOutgoing: boolean;
  isActive: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  callType: CallType;
  conversationId: string;
  remoteUserId: string;
  remoteUserName: string;
  duration: number;
  startTime?: Date;
}

export interface CallAction {
  type: 'invite' | 'accept' | 'reject' | 'cancel' | 'end';
  conversationId: string;
  callType?: CallType;
  reason?: string;
}
