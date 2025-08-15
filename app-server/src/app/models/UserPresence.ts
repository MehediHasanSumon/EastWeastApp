import mongoose, { Document, Schema } from "mongoose";

export interface IUserPresence extends Document {
  userId: mongoose.Types.ObjectId;
  isOnline: boolean;
  lastSeen: Date;
  socketId?: string;
  deviceInfo?: {
    userAgent: string;
    ip: string;
  };
  updatedAt: Date;
}

const userPresenceSchema = new Schema<IUserPresence>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
userPresenceSchema.index({ isOnline: 1 });
userPresenceSchema.index({ lastSeen: -1 });

export default mongoose.model<IUserPresence>("UserPresence", userPresenceSchema);
