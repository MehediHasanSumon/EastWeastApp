import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UserStatus {
  userId: string;
  status: "online" | "offline" | "away";
  lastSeen?: Date;
}

interface UsersState {
  userStatuses: { [userId: string]: UserStatus };
  onlineUsers: string[];
}

const initialState: UsersState = {
  userStatuses: {},
  onlineUsers: [],
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    updateStatus: (state, action: PayloadAction<{ userId: string; status: string; lastSeen?: Date }>) => {
      const { userId, status, lastSeen } = action.payload;
      state.userStatuses[userId] = { userId, status: status as "online" | "offline" | "away", lastSeen };

      if (status === "online" && !state.onlineUsers.includes(userId)) {
        state.onlineUsers.push(userId);
      } else if (status === "offline") {
        state.onlineUsers = state.onlineUsers.filter((id) => id !== userId);
      }
    },
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
  },
});

export const { updateStatus, setOnlineUsers } = usersSlice.actions;
export default usersSlice.reducer;
