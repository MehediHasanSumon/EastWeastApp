import mongoose, { Document, Schema } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  type: "direct" | "group";
  name?: string;
  avatar?: string;
  admins?: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageTime?: Date;
  unreadCount?: { [userId: string]: number };
  mutedBy?: { [userId: string]: boolean };
  blockedBy?: mongoose.Types.ObjectId[];
  deletedBy?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },
    name: {
      type: String,
      required: function (this: IConversation) {
        return this.type === "group";
      },
    },
    avatar: {
      type: String,
    },
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageTime: {
      type: Date,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    mutedBy: {
      type: Map,
      of: Boolean,
      default: {},
    },
    blockedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deletedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
conversationSchema.index({ participants: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ lastMessageTime: -1 });

export default mongoose.model<IConversation>("Conversation", conversationSchema);
