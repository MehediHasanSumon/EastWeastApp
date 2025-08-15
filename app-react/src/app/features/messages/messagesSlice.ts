import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import request from "../../../service/AxiosInstance";
import type { MessageData } from "../../../service/socketService";

interface MessagesState {
  messages: { [conversationId: string]: MessageData[] };
  loading: boolean;
  error: string | null;
  typingUsers: { [conversationId: string]: { userId: string; userName: string }[] };
}

const initialState: MessagesState = {
  messages: {},
  loading: false,
  error: null,
  typingUsers: {},
};

export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async ({ conversationId, page = 1, limit = 50 }: { conversationId: string; page?: number; limit?: number }) => {
    const response = await request.get(`/api/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return { conversationId, messages: response.data };
  }
);

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<MessageData>) => {
      const message = action.payload;
      if (!state.messages[message.conversationId]) {
        state.messages[message.conversationId] = [];
      }
      state.messages[message.conversationId].push(message);
    },
    addOptimisticMessage: (state, action: PayloadAction<MessageData & { tempId: string }>) => {
      const message = action.payload;
      if (!state.messages[message.conversationId]) {
        state.messages[message.conversationId] = [];
      }
      state.messages[message.conversationId].push(message);
    },
    markDelivered: (state, action: PayloadAction<{ tempId?: string; messageId: string }>) => {
      const { tempId, messageId } = action.payload;
      Object.keys(state.messages).forEach((conversationId) => {
        const messageIndex = state.messages[conversationId].findIndex(
          (msg) => (tempId && msg.metadata?.tempId === tempId) || msg.id === messageId
        );
        if (messageIndex !== -1) {
          state.messages[conversationId][messageIndex].id = messageId;
          if (state.messages[conversationId][messageIndex].metadata?.tempId) {
            delete state.messages[conversationId][messageIndex].metadata.tempId;
          }
        }
      });
    },
    markRead: (state, action: PayloadAction<{ messageId: string; userId: string; conversationId: string }>) => {
      const { messageId, userId, conversationId } = action.payload;
      if (state.messages[conversationId]) {
        const messageIndex = state.messages[conversationId].findIndex((msg) => msg.id === messageId);
        if (messageIndex !== -1) {
          if (!state.messages[conversationId][messageIndex].readBy.includes(userId)) {
            state.messages[conversationId][messageIndex].readBy.push(userId);
          }
        }
      }
    },
    setTyping: (
      state,
      action: PayloadAction<{ userId: string; userName: string; conversationId: string; isTyping: boolean }>
    ) => {
      const { userId, userName, conversationId, isTyping } = action.payload;

      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }

      const existingIndex = state.typingUsers[conversationId].findIndex((user) => user.userId === userId);

      if (isTyping && existingIndex === -1) {
        state.typingUsers[conversationId].push({ userId, userName });
      } else if (!isTyping && existingIndex !== -1) {
        state.typingUsers[conversationId].splice(existingIndex, 1);
      }
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      delete state.messages[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, messages } = action.payload;
        state.messages[conversationId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch messages";
      });
  },
});

export const { addMessage, addOptimisticMessage, markDelivered, markRead, setTyping, clearMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
