import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IChatState, IConversation, IMessage, IUser, ISocketMessage, ITypingData } from '../types/chat';
import { chatApiService } from '../utils/chatApi';

const initialState: IChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  typingUsers: [],
  loading: false,
  error: null,
  isConnected: false,
  selectedUsers: [],
  searchResults: [],
  pagination: {
    page: 1,
    limit: 20,
    hasMore: true,
  },
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatApiService.getConversations();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue('Failed to fetch conversations');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, page = 1, limit = 20 }: { conversationId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await chatApiService.getMessages(conversationId, page, limit);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue('Failed to fetch messages');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData: ISocketMessage, { rejectWithValue }) => {
    try {
      const response = await chatApiService.sendMessage(messageData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue('Failed to send message');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (conversationData: { participants: string[]; type: 'direct' | 'group'; name?: string }, { rejectWithValue }) => {
    try {
      const response = await chatApiService.createConversation(conversationData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue('Failed to create conversation');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create conversation');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'chat/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await chatApiService.searchUsers(query);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue('Failed to search users');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search users');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<IConversation | null>) => {
      state.currentConversation = action.payload;
      if (action.payload) {
        // Reset messages when switching conversations
        state.messages = [];
        state.pagination.page = 1;
        state.pagination.hasMore = true;
      }
    },
    
    addMessage: (state, action: PayloadAction<IMessage>) => {
      const message = action.payload;
      
      // Add message to current conversation if it matches
      if (state.currentConversation?._id === message.conversationId) {
        state.messages.push(message);
      }
      
      // Update conversation's last message
      const conversationIndex = state.conversations.findIndex(c => c._id === message.conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message;
        state.conversations[conversationIndex].updatedAt = new Date();
        
        // Move conversation to top
        const conversation = state.conversations.splice(conversationIndex, 1)[0];
        state.conversations.unshift(conversation);
      }
    },
    
    updateMessage: (state, action: PayloadAction<{ messageId: string; updates: Partial<IMessage> }>) => {
      const { messageId, updates } = action.payload;
      
      // Update message in messages array
      const messageIndex = state.messages.findIndex(m => m._id === messageId);
      if (messageIndex !== -1) {
        state.messages[messageIndex] = { ...state.messages[messageIndex], ...updates };
      }
      
      // Update message in conversation's last message if it's the last message
      state.conversations.forEach(conversation => {
        if (conversation.lastMessage?._id === messageId) {
          conversation.lastMessage = { ...conversation.lastMessage, ...updates };
        }
      });
    },
    
    deleteMessage: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      
      // Remove message from messages array
      state.messages = state.messages.filter(m => m._id !== messageId);
      
      // Update conversation's last message if needed
      state.conversations.forEach(conversation => {
        if (conversation.lastMessage?._id === messageId) {
          // Find the next most recent message
          const nextMessage = state.messages
            .filter(m => m.conversationId === conversation._id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          
          conversation.lastMessage = nextMessage;
        }
      });
    },
    
    setTypingUser: (state, action: PayloadAction<ITypingData>) => {
      const { conversationId, userId, isTyping } = action.payload;
      
      if (state.currentConversation?._id === conversationId) {
        if (isTyping) {
          if (!state.typingUsers.includes(userId)) {
            state.typingUsers.push(userId);
          }
        } else {
          state.typingUsers = state.typingUsers.filter(id => id !== userId);
        }
      }
    },
    
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    
    addSelectedUser: (state, action: PayloadAction<IUser>) => {
      if (!state.selectedUsers.find(u => u._id === action.payload._id)) {
        state.selectedUsers.push(action.payload);
      }
    },
    
    removeSelectedUser: (state, action: PayloadAction<string>) => {
      state.selectedUsers = state.selectedUsers.filter(u => u._id !== action.payload);
    },
    
    clearSelectedUsers: (state) => {
      state.selectedUsers = [];
    },
    
    setSearchResults: (state, action: PayloadAction<IUser[]>) => {
      state.searchResults = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    updateConversation: (state, action: PayloadAction<IConversation>) => {
      const updatedConversation = action.payload;
      const index = state.conversations.findIndex(c => c._id === updatedConversation._id);
      
      if (index !== -1) {
        state.conversations[index] = updatedConversation;
        
        // Update current conversation if it's the same one
        if (state.currentConversation?._id === updatedConversation._id) {
          state.currentConversation = updatedConversation;
        }
      }
    },
    
    markConversationAsRead: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const conversation = state.conversations.find(c => c._id === conversationId);
      
      if (conversation) {
        // Reset unread count for current user
        // TODO: Get current user ID from auth state
        const currentUserId = 'currentUser'; // This should come from auth state
        conversation.unreadCount[currentUserId] = 0;
      }
    },

    addMessageReaction: (state, action: PayloadAction<{
      messageId: string;
      reactionType: string;
      emoji: string;
      userId: string;
      userName: string;
    }>) => {
      const { messageId, reactionType, emoji, userId, userName } = action.payload;
      
      // Add reaction to message in messages array
      const messageIndex = state.messages.findIndex(m => m._id === messageId);
      if (messageIndex !== -1) {
        if (!state.messages[messageIndex].reactions) {
          state.messages[messageIndex].reactions = [];
        }
        
        // Check if user already reacted with this type
        const existingReactionIndex = state.messages[messageIndex].reactions!.findIndex(
          r => r.userId === userId && r.type === reactionType
        );
        
        if (existingReactionIndex !== -1) {
          // Update existing reaction
          state.messages[messageIndex].reactions![existingReactionIndex].emoji = emoji;
        } else {
          // Add new reaction
          state.messages[messageIndex].reactions!.push({
            type: reactionType,
            emoji,
            userId,
            userName,
          });
        }
      }
    },
    
    resetChatState: (state) => {
      return initialState;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.length > 0) {
          state.messages = action.payload;
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Message is already added via socket or API response
        // This is just for optimistic updates
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Create conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.currentConversation = action.payload;
        state.selectedUsers = [];
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Search users
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentConversation,
  addMessage,
  updateMessage,
  deleteMessage,
  setTypingUser,
  setConnectionStatus,
  addSelectedUser,
  removeSelectedUser,
  clearSelectedUsers,
  setSearchResults,
  clearError,
  updateConversation,
  markConversationAsRead,
  addMessageReaction,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;
