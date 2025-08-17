import api from './api';
import { ChatConversation, ChatMessage, ChatApiResponse, ChatUser } from '../types/chat';

class ChatApiService {
  // Get all conversations for the current user
  async getConversations(): Promise<ChatConversation[]> {
    try {
      const response = await api.get<ChatApiResponse<ChatConversation[]>>('/api/chat/conversations');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }

  // Create a new conversation
  async createConversation(participantIds: string[], type: 'direct' | 'group' = 'direct', name?: string): Promise<ChatConversation> {
    try {
      const response = await api.post<ChatApiResponse<ChatConversation>>('/api/chat/conversations', {
        participantIds,
        type,
        name
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      throw new Error(error.response?.data?.message || 'Failed to create conversation');
    }
  }

  // Get a specific conversation
  async getConversation(conversationId: string): Promise<ChatConversation> {
    try {
      const response = await api.get<ChatApiResponse<ChatConversation>>(`/api/chat/conversations/${conversationId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch conversation:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch conversation');
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<{
    messages: ChatMessage[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalMessages: number;
      hasMore: boolean;
    };
  }> {
    try {
      const response = await api.get<ChatApiResponse<ChatMessage[]>>(
        `/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
      );
      return {
        messages: response.data.data,
        pagination: response.data.pagination!
      };
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch messages');
    }
  }

  // Upload media file
  async uploadMedia(file: any): Promise<{ url: string; fileName: string; fileSize: number }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ChatApiResponse<{ url: string; fileName: string; fileSize: number }>>(
        '/api/chat/media',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to upload media:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload media');
    }
  }

  // Mute/unmute conversation
  async muteConversation(conversationId: string, muted: boolean): Promise<void> {
    try {
      await api.put(`/api/chat/conversations/${conversationId}/mute`, { muted });
    } catch (error: any) {
      console.error('Failed to mute conversation:', error);
      throw new Error(error.response?.data?.message || 'Failed to mute conversation');
    }
  }

  // Delete conversation for current user (soft delete)
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await api.delete(`/api/chat/conversations/${conversationId}`);
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete conversation');
    }
  }

  // Get online users
  async getOnlineUsers(): Promise<string[]> {
    try {
      const response = await api.get<ChatApiResponse<string[]>>('/api/chat/users/online');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch online users:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch online users');
    }
  }

  // Search users
  async searchUsers(query: string): Promise<ChatUser[]> {
    try {
      const response = await api.get<ChatApiResponse<ChatUser[]>>(`/api/chat/users/search?q=${encodeURIComponent(query)}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to search users:', error);
      throw new Error(error.response?.data?.message || 'Failed to search users');
    }
  }
}

export const chatApiService = new ChatApiService();
