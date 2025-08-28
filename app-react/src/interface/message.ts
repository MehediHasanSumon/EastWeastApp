export interface User {
  _id: string;
  name: string;
  email: string;
  online?: boolean;
  avatar?: string;
  profile_picture?: string;
  phone?: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: {
    content: string;
    sender: any;
    createdAt: string;
    type: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
  avatar?: string;
  type?: string;
  readBy?: any[];
}

export interface CurrentUser {
  name: string;
  username: string;
  status: string;
  phone: string;
  email: string;
  timezone: string;
  memberSince: string;
  mutualConnections: number;
  sharedFiles: number;
  sharedPhotos: number;
}
