import { IConversation, IMessage, INewConversation, ISocketMessage, IMessagesResponse, IConversationResponse, ISendMessageResponse } from '../types/chat';
import { getAccessToken, getRefreshToken } from './authStorage';
import { getBackendUrl } from '../config/environment';

// Use environment configuration for API base URL
const API_BASE_URL = getBackendUrl() + '/api/chat';

class ChatApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    if (refreshToken) {
      headers['x-refresh-token'] = refreshToken;
    }
    
    return headers;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const headers = await this.getAuthHeaders();
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      console.log('🌐 Making API request:', {
        url: fullUrl,
        method: options.method || 'GET',
        endpoint,
        hasAuth: !!(headers as Record<string, string>)['Authorization'],
        hasRefreshToken: !!(headers as Record<string, string>)['x-refresh-token']
      });
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      console.log('📡 API Response:', {
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ API Success:', {
        url: fullUrl,
        dataType: typeof data,
        hasData: !!data,
        success: data?.success
      });
      
      return data;
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Conversations
  async getConversations(): Promise<{ success: boolean; data: IConversation[] }> {
    return this.makeRequest<{ success: boolean; data: IConversation[] }>('/conversations');
  }

  async getConversation(conversationId: string): Promise<{ success: boolean; data: IConversation }> {
    return this.makeRequest<{ success: boolean; data: IConversation }>(`/conversations/${conversationId}`);
  }

  async createConversation(conversationData: INewConversation): Promise<{ success: boolean; data: IConversation }> {
    return this.makeRequest<{ success: boolean; data: IConversation }>('/conversations', {
      method: 'POST',
      body: JSON.stringify(conversationData),
    });
  }

  async updateConversation(conversationId: string, updates: Partial<IConversation>): Promise<{ success: boolean; data: IConversation }> {
    return this.makeRequest<{ success: boolean; data: IConversation }>(`/conversations/${conversationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  // Messages
  async getMessages(conversationId: string, page: number = 1, limit: number = 20): Promise<IMessagesResponse> {
    return this.makeRequest<IMessagesResponse>(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  }

  async sendMessage(messageData: ISocketMessage): Promise<ISendMessageResponse> {
    return this.makeRequest<ISendMessageResponse>(`/conversations/${messageData.conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        mediaUrl: messageData.mediaUrl,
        fileName: messageData.fileName,
        fileSize: messageData.fileSize,
        duration: messageData.duration,
        replyTo: messageData.replyTo,
      }),
    });
  }

  async updateMessage(conversationId: string, messageId: string, updates: Partial<IMessage>): Promise<{ success: boolean; data: IMessage }> {
    return this.makeRequest<{ success: boolean; data: IMessage }>(`/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/conversations/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async markMessageAsRead(conversationId: string, messageId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/conversations/${conversationId}/messages/${messageId}/read`, {
      method: 'POST',
    });
  }

  async markConversationAsRead(conversationId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  }

  // User search
  async searchUsers(query: string): Promise<{ success: boolean; data: any[] }> {
    return this.makeRequest<{ success: boolean; data: any[] }>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  // File uploads
  async uploadFile(conversationId: string, file: File, type: 'image' | 'file' | 'voice'): Promise<{ success: boolean; data: { url: string; fileName: string; fileSize: number } }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const headers = await this.getAuthHeaders();
    const { 'Content-Type': _, ...uploadHeaders } = headers as Record<string, string>; // Remove Content-Type for FormData

    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/media`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed: ${response.status}`);
    }

    return response.json();
  }

  // Voice messages
  async uploadVoiceMessage(conversationId: string, audioBlob: Blob, duration: number): Promise<{ success: boolean; data: { url: string; duration: number } }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-message.m4a');
    formData.append('duration', duration.toString());

    const headers = await this.getAuthHeaders();
    const { 'Content-Type': _, ...uploadHeaders } = headers as Record<string, string>; // Remove Content-Type for FormData

    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/voice`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Voice upload failed: ${response.status}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const chatApiService = new ChatApiService();
export default chatApiService;
