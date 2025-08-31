import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, ChatConversation, ChatMessage, TypingUser, SocketMessage } from '../types/chat';
import { chatApiService } from '../utils/chatApi';
import { chatSocketService } from '../utils/chatSocket';

// Helper function to ensure message dates are serializable
const normalizeMessageDates = (message: any) => {
  if (message.editedAt instanceof Date) {
    message.editedAt = message.editedAt.toISOString();
  }
  if (message.deletedAt instanceof Date) {
    message.deletedAt = message.deletedAt.toISOString();
  }
  if (message.createdAt instanceof Date) {
    message.createdAt = message.createdAt.toISOString();
  }
  if (message.updatedAt instanceof Date) {
    message.updatedAt = message.updatedAt.toISOString();
  }
  return message;
};

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  typingUsers: {},
  onlineUsers: [],
  isLoading: false,
  error: null,
  isConnected: false,
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const conversations = await chatApiService.getConversations();
      return conversations;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, page = 1 }: { conversationId: string; page?: number }, { rejectWithValue }) => {
    try {
      const result = await chatApiService.getMessages(conversationId, page);
      return { conversationId, ...result };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async ({ participantIds, type, name }: { participantIds: string[]; type: 'direct' | 'group'; name?: string }, { rejectWithValue }) => {
    try {
      const conversation = await chatApiService.createConversation(participantIds, type, name);
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData: SocketMessage, { rejectWithValue, getState }) => {
    try {
      const result = await chatSocketService.sendMessage(messageData);
      if (result.success && result.message) {
        return result.message;
      } else {
        return rejectWithValue(result.error || 'Failed to send message');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<ChatConversation | null>) => {
      state.currentConversation = action.payload;
    },
    
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const message = normalizeMessageDates(action.payload);
      const conversationId = message.conversationId;
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      // Check if message already exists
      const existingIndex = state.messages[conversationId].findIndex(m => m._id === message._id);
      if (existingIndex === -1) {
        state.messages[conversationId].push(message);
        // Sort by creation time
        state.messages[conversationId].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      
      // Update conversation's last message
      const conversationIndex = state.conversations.findIndex(c => c._id === conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message;
        state.conversations[conversationIndex].lastMessageTime = message.createdAt;
      }
    },
    
    updateMessage: (state, action: PayloadAction<{ messageId: string; conversationId: string; updates: Partial<ChatMessage> }>) => {
      const { messageId, conversationId, updates } = action.payload;
      const messages = state.messages[conversationId];
      if (messages) {
        const messageIndex = messages.findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex] = { ...messages[messageIndex], ...updates };
        }
      }
    },
    
    removeMessage: (state, action: PayloadAction<{ messageId: string; conversationId: string }>) => {
      const { messageId, conversationId } = action.payload;
      const messages = state.messages[conversationId];
      if (messages) {
        state.messages[conversationId] = messages.filter(m => m._id !== messageId);
      }
    },
    
    deleteMessage: (state, action: PayloadAction<{ messageId: string; conversationId: string; deleteForEveryone: boolean }>) => {
      const { messageId, conversationId, deleteForEveryone } = action.payload;
      const messages = state.messages[conversationId];
      if (messages) {
        if (deleteForEveryone) {
          // Hard delete - remove message completely
          state.messages[conversationId] = messages.filter(m => m._id !== messageId);
        } else {
          // Soft delete - mark message as deleted
          const messageIndex = messages.findIndex(m => m._id === messageId);
          if (messageIndex !== -1) {
            messages[messageIndex].isDeleted = true;
            messages[messageIndex].deletedAt = new Date().toISOString();
          }
        }
      }
    },
    
    setTypingUser: (state, action: PayloadAction<TypingUser>) => {
      const { conversationId, userId, isTyping } = action.payload;
      
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      
      if (isTyping) {
        // Add or update typing user
        const existingIndex = state.typingUsers[conversationId].findIndex(u => u.userId === userId);
        if (existingIndex === -1) {
          state.typingUsers[conversationId].push(action.payload);
        } else {
          state.typingUsers[conversationId][existingIndex] = action.payload;
        }
      } else {
        // Remove typing user
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(u => u.userId !== userId);
      }
    },
    
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    
    addOnlineUser: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
    },
    
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    
    updateConversation: (state, action: PayloadAction<ChatConversation>) => {
      const conversationIndex = state.conversations.findIndex(c => c._id === action.payload._id);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex] = action.payload;
      } else {
        state.conversations.unshift(action.payload);
      }
    },
    
    removeConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(c => c._id !== action.payload);
      delete state.messages[action.payload];
      delete state.typingUsers[action.payload];
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    clearMessages: (state, action: PayloadAction<string>) => {
      state.messages[action.payload] = [];
    },
    
    addMessageReaction: (state, action: PayloadAction<{
      messageId: string;
      userId: string;
      reactionType: string;
      emoji: string;
      conversationId: string;
    }>) => {
      const { messageId, userId, reactionType, emoji, conversationId } = action.payload;
      
      if (state.messages[conversationId]) {
        const messageIndex = state.messages[conversationId].findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          state.messages[conversationId][messageIndex].reactions[userId] = {
            type: reactionType,
            emoji,
            timestamp: new Date().toISOString(),
          };
        }
      }
    },
    
    removeMessageReaction: (state, action: PayloadAction<{
      messageId: string;
      userId: string;
      conversationId: string;
    }>) => {
      const { messageId, userId, conversationId } = action.payload;
      
      if (state.messages[conversationId]) {
        const messageIndex = state.messages[conversationId].findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          delete state.messages[conversationId][messageIndex].reactions[userId];
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, messages, pagination } = action.payload;
        
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        
        // Normalize dates in messages to ensure they're serializable
        const normalizedMessages = messages.map(normalizeMessageDates);
        
        // If it's the first page, replace messages, otherwise append
        if (pagination.currentPage === 1) {
          state.messages[conversationId] = normalizedMessages;
        } else {
          // Prepend older messages
          state.messages[conversationId] = [...normalizedMessages, ...state.messages[conversationId]];
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
      })
      
      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Message is already added via socket event
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentConversation,
  addMessage,
  updateMessage,
  removeMessage,
  deleteMessage,
  setTypingUser,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setConnectionStatus,
  updateConversation,
  removeConversation,
  clearError,
  clearMessages,
  addMessageReaction,
  removeMessageReaction,
} = chatSlice.actions;

export default chatSlice.reducer;
