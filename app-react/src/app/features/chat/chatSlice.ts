import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { ChatService, type IConversation, type IMessage, type IUser } from "../../../service/chatService";

interface ChatState {
  conversations: IConversation[];
  currentConversation: IConversation | null;
  messages: { [conversationId: string]: IMessage[] };
  loading: boolean;
  error: string | null;
  typingUsers: { [conversationId: string]: string[] };
  onlineUsers: IUser[];
  selectedUsers: IUser[];
  searchResults: IUser[];
  pagination: {
    [conversationId: string]: {
      currentPage: number;
      totalPages: number;
      totalMessages: number;
      hasMore: boolean;
    };
  };
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  loading: false,
  error: null,
  typingUsers: {},
  onlineUsers: [],
  selectedUsers: [],
  searchResults: [],
  pagination: {},
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const conversations = await ChatService.getConversations();
      return conversations;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch conversations");
    }
  }
);

export const createConversation = createAsyncThunk(
  "chat/createConversation",
  async (data: {
    participants: string[];
    type: "direct" | "group";
    name?: string;
    avatar?: string;
  }, { rejectWithValue }) => {
    try {
      const conversation = await ChatService.createConversation(data);
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create conversation");
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (data: { conversationId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const result = await ChatService.getMessages(
        data.conversationId,
        data.page || 1,
        data.limit || 50
      );
      return { conversationId: data.conversationId, ...result };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch messages");
    }
  }
);

export const fetchConversation = createAsyncThunk(
  "chat/fetchConversation",
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const conversation = await ChatService.getConversation(conversationId);
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch conversation");
    }
  }
);

export const searchUsers = createAsyncThunk(
  "chat/searchUsers",
  async (query: string, { rejectWithValue }) => {
    try {
      const users = await ChatService.searchUsers(query);
      return users;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to search users");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<IConversation | null>) => {
      state.currentConversation = action.payload;
    },
    
    addMessage: (state, action: PayloadAction<IMessage>) => {
      const message = action.payload;
      const conversationId = message.conversationId;
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      // Check if message already exists
      const existingIndex = state.messages[conversationId].findIndex(m => m._id === message._id);
      if (existingIndex === -1) {
        state.messages[conversationId].push(message);
      }
      
      // Update conversation's last message
      const conversationIndex = state.conversations.findIndex(c => c._id === conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message;
        state.conversations[conversationIndex].lastMessageTime = message.createdAt;
      }
    },
    
    updateMessage: (state, action: PayloadAction<{ messageId: string; content: string; editedAt: string }>) => {
      const { messageId, content, editedAt } = action.payload;
      
      // Find and update message in all conversations
      Object.keys(state.messages).forEach(conversationId => {
        const messageIndex = state.messages[conversationId].findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          state.messages[conversationId][messageIndex].content = content;
          state.messages[conversationId][messageIndex].isEdited = true;
          state.messages[conversationId][messageIndex].editedAt = editedAt;
        }
      });
    },
    
    deleteMessage: (state, action: PayloadAction<{ messageId: string }>) => {
      const { messageId } = action.payload;
      
      // Mark message as deleted in all conversations
      Object.keys(state.messages).forEach(conversationId => {
        const messageIndex = state.messages[conversationId].findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          state.messages[conversationId][messageIndex].isDeleted = true;
          state.messages[conversationId][messageIndex].deletedAt = new Date().toISOString();
        }
      });
    },
    
    addMessageReaction: (state, action: PayloadAction<{
      messageId: string;
      userId: string;
      reactionType: string;
      emoji: string;
    }>) => {
      const { messageId, userId, reactionType, emoji } = action.payload;
      
      Object.keys(state.messages).forEach(conversationId => {
        const messageIndex = state.messages[conversationId].findIndex(m => m._id === messageId);
        if (messageIndex !== -1) {
          state.messages[conversationId][messageIndex].reactions[userId] = {
            type: reactionType,
            emoji
          };
        }
      });
    },
    
    setTypingUser: (state, action: PayloadAction<{
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }>) => {
      const { conversationId, userId, isTyping } = action.payload;
      
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      
      if (isTyping) {
        if (!state.typingUsers[conversationId].includes(userId)) {
          state.typingUsers[conversationId].push(userId);
        }
      } else {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          id => id !== userId
        );
      }
    },
    
    updateUserPresence: (state, action: PayloadAction<{
      userId: string;
      isOnline: boolean;
      lastSeen: string;
    }>) => {
      const { userId, isOnline, lastSeen } = action.payload;
      
      // Update presence in conversations
      state.conversations.forEach(conversation => {
        conversation.participants.forEach(participant => {
          if (participant._id === userId) {
            participant.presence = { isOnline, lastSeen };
          }
        });
      });
      
      // Update current conversation if it exists
      if (state.currentConversation) {
        state.currentConversation.participants.forEach(participant => {
          if (participant._id === userId) {
            participant.presence = { isOnline, lastSeen };
          }
        });
      }
    },
    
    setSelectedUsers: (state, action: PayloadAction<IUser[]>) => {
      state.selectedUsers = action.payload;
    },
    
    addSelectedUser: (state, action: PayloadAction<IUser>) => {
      const user = action.payload;
      if (!state.selectedUsers.find(u => u._id === user._id)) {
        state.selectedUsers.push(user);
      }
    },
    
    removeSelectedUser: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      state.selectedUsers = state.selectedUsers.filter(u => u._id !== userId);
    },
    
    clearSelectedUsers: (state) => {
      state.selectedUsers = [];
    },
    
    clearError: (state) => {
      state.error = null;
    },
    // Optimistically reset unread counts when conversation is read
    conversationUnreadReset: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload;
      const idx = state.conversations.findIndex((c) => c._id === conversationId);
      if (idx !== -1 && state.conversations[idx].unreadCount) {
        state.conversations[idx].unreadCount![userId] = 0;
      }
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
      
      // Create conversation
      .addCase(createConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.loading = false;
        // Check if conversation already exists
        const existingIndex = state.conversations.findIndex(c => c._id === action.payload._id);
        if (existingIndex === -1) {
          state.conversations.unshift(action.payload);
        }
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        // Keep global loading for first page only; subsequent pages use local isLoadingOlder
        state.loading = state.loading || false;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, data, pagination } = action.payload as {
          conversationId: string;
          data: IMessage[];
          pagination: { currentPage: number; totalPages: number; totalMessages: number; hasMore: boolean };
        };
        const isLoadMore = !!state.messages[conversationId] && (pagination.currentPage || 1) > 1;
        if (isLoadMore) {
          const existing = state.messages[conversationId] || [];
          const existingIds = new Set(existing.map((m) => m._id));
          const newUnique = data.filter((m) => !existingIds.has(m._id));
          state.messages[conversationId] = [...newUnique, ...existing];
        } else {
          state.messages[conversationId] = data;
        }
        state.pagination[conversationId] = pagination;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch conversation
      .addCase(fetchConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentConversation = action.payload;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentConversation,
  addMessage,
  updateMessage,
  deleteMessage,
  addMessageReaction,
  setTypingUser,
  updateUserPresence,
  setSelectedUsers,
  addSelectedUser,
  removeSelectedUser,
  clearSelectedUsers,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
