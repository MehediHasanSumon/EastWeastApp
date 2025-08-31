import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  messageType: "text" | "image" | "file" | "voice" | "video";
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number; // for voice/video messages
  replyTo?: mongoose.Types.ObjectId;
  isForwarded?: boolean;
  originalMessageId?: mongoose.Types.ObjectId;
  originalSenderId?: mongoose.Types.ObjectId;
  reactions: {
    [userId: string]: {
      type: string;
      emoji: string;
    };
  };
  readBy: mongoose.Types.ObjectId[];
  deliveredTo: mongoose.Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "voice", "video"],
      default: "text",
    },
    mediaUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    originalMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    originalSenderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reactions: {
      type: Map,
      of: {
        type: {
          type: String,
          enum: ["like", "love", "laugh", "wow", "sad", "angry"],
        },
        emoji: String,
      },
      default: {},
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deliveredTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ replyTo: 1 });

export default mongoose.model<IMessage>("Message", messageSchema);
