import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import request from "../../../service/AxiosInstance";
import type { ConversationData, MessageData } from "../../../service/socketService";

interface ConversationsState {
  conversations: ConversationData[];
  selectedConversation: ConversationData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConversationsState = {
  conversations: [],
  selectedConversation: null,
  loading: false,
  error: null,
};

export const fetchConversations = createAsyncThunk("conversations/fetchConversations", async () => {
  const response = await request.get("/api/conversations");
  return response.data;
});

export const createConversation = createAsyncThunk(
  "conversations/createConversation",
  async ({ participants, name, isGroup }: { participants: string[]; name?: string; isGroup?: boolean }) => {
    const response = await request.post("/api/conversations", { participants, name, isGroup });
    return response.data;
  }
);

const conversationsSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    setSelectedConversation: (state, action: PayloadAction<ConversationData | null>) => {
      state.selectedConversation = action.payload;
    },
    updateLastMessage: (state, action: PayloadAction<{ conversationId: string; message: MessageData }>) => {
      const { conversationId, message } = action.payload;
      const conversationIndex = state.conversations.findIndex((conv) => conv.id === conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message;
        // Move conversation to top
        const conversation = state.conversations.splice(conversationIndex, 1)[0];
        state.conversations.unshift(conversation);
      }
    },
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const conversationIndex = state.conversations.findIndex((conv) => conv.id === conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].unreadCount += 1;
      }
    },
    clearUnreadCount: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const conversationIndex = state.conversations.findIndex((conv) => conv.id === conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].unreadCount = 0;
      }
    },
    addConversation: (state, action: PayloadAction<ConversationData>) => {
      const existingIndex = state.conversations.findIndex((conv) => conv.id === action.payload.id);
      if (existingIndex === -1) {
        state.conversations.unshift(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
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
        state.error = action.error.message || "Failed to fetch conversations";
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
      });
  },
});

export const { setSelectedConversation, updateLastMessage, incrementUnreadCount, clearUnreadCount, addConversation } =
  conversationsSlice.actions;
export default conversationsSlice.reducer;
