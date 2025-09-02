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
      // Create FormData with proper file handling for React Native
      const formData = new FormData();
      
      // Ensure the file object has the correct structure for React Native
      // React Native requires specific properties for file uploads
      const fileToUpload = {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || `file_${Date.now()}`,
      };
      
      // For React Native, we need to append the file object directly
      // The FormData.append will handle the proper formatting
      formData.append('file', fileToUpload as any);

      // Log the FormData contents in development
      if (__DEV__) {
        console.log('Uploading file:', {
          uri: file.uri,
          type: file.type,
          name: file.name,
          size: file.fileSize
        });
        console.log('FormData created:', formData);
      }

      const response = await api.post<ChatApiResponse<{ url: string; fileName: string; fileSize: number }>>(
        '/api/chat/media',
        formData,
        {
          headers: {
            // Don't set Content-Type manually - let React Native set it with boundary
            'Accept': 'application/json',
          },
          timeout: 60000, // 60 seconds timeout for file uploads
          transformRequest: (data, headers) => {
            // Ensure FormData is not transformed
            if (data instanceof FormData) {
              return data;
            }
            return data;
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Failed to upload media';
      
      if (error.userMessage) {
        errorMessage = error.userMessage;
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large. Please select a smaller file.';
      } else if (error.response?.status === 415) {
        errorMessage = 'Unsupported file type. Please select a valid image or document.';
      } else if (error.response?.status === 0) {
        errorMessage = 'Server connection failed. Please check if the server is running.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Please try again with a smaller file or better connection.';
      } else if (error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Log error in development only
      if (__DEV__) {
        console.error('Failed to upload media:', error);
      }
      
      throw new Error(errorMessage);
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
