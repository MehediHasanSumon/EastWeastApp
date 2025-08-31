import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { verifyRefreshToken } from "../utils/jwt";
import UserPresence from "../app/models/UserPresence";
import Conversation from "../app/models/Conversation";
import Message from "../app/models/Message";
import Users from "../app/models/Users";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface SocketData {
  userId: string;
  user: any;
}

export class SocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Prefer explicit auth.token from client; otherwise try headers
        let token: string | undefined = socket.handshake.auth?.token as string | undefined;

        // Support x-refresh-token header
        if (!token) {
          const headerRt = socket.handshake.headers["x-refresh-token"]; // may be string | string[]
          token = Array.isArray(headerRt) ? headerRt[0] : (headerRt as string | undefined);
        }

        // Support Authorization: Bearer <token>
        if (!token) {
          const authz = socket.handshake.headers.authorization as string | undefined;
          if (authz && authz.toLowerCase().startsWith("bearer ")) {
            token = authz.slice(7).trim();
          }
        }

        if (!token) {
          return next(new Error("Authentication error"));
        }

        // Validate refresh token using the same verifier as HTTP middleware
        const decoded = await verifyRefreshToken(token);
        const userId = decoded.id; // payload uses `id`
        const user = await Users.findById(userId).select("-password");

        if (!user) {
          return next(new Error("User not found"));
        }

        socket.userId = userId;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.userId}`);

      // Store user connection (support multiple tabs/devices)
      const current = this.connectedUsers.get(socket.userId!) || new Set<string>();
      current.add(socket.id);
      this.connectedUsers.set(socket.userId!, current);

      // Update user presence
      this.updateUserPresence(socket.userId!, true, socket.id);

      // Join user's conversations
      this.joinUserConversations(socket.userId!);
      // Mark undelivered messages as delivered for this user
      this.markUndeliveredAsDeliveredForUser(socket.userId!).catch(() => {});

      // Handle typing events
      socket.on("typing_start", async (data: { conversationId: string }) => {
        if (!(await this.isParticipant(data.conversationId, socket.userId!))) return;
        socket.to(data.conversationId).emit("typing_start", {
          userId: socket.userId,
          conversationId: data.conversationId,
        });
      });

      socket.on("typing_stop", async (data: { conversationId: string }) => {
        if (!(await this.isParticipant(data.conversationId, socket.userId!))) return;
        socket.to(data.conversationId).emit("typing_stop", {
          userId: socket.userId,
          conversationId: data.conversationId,
        });
      });

      // Handle new message
      socket.on("send_message", async (data: {
        conversationId: string;
        content: string;
        messageType?: string;
        mediaUrl?: string;
        fileName?: string;
        fileSize?: number;
        duration?: number; // voice/video length in seconds
        replyTo?: string;
        isForwarded?: boolean;
        originalMessageId?: string;
        originalSenderId?: string;
      }, ack?: (res: any) => void) => {
        try {
          // Authorization: must be participant
          const isMember = await this.isParticipant(data.conversationId, socket.userId!);
          if (!isMember) {
            if (ack) ack({ success: false, error: "Not a participant of this conversation" });
            return;
          }

          // Check if sender is blocked from this conversation
          const conversation = await Conversation.findById(data.conversationId);
          if (conversation && (conversation as any).blockedBy && (conversation as any).blockedBy.includes(socket.userId!)) {
            if (ack) ack({ success: false, error: "You are blocked from sending messages in this conversation" });
            return;
          }

          // Validate: require content for text; allow empty content when media exists
          const isText = !data.messageType || data.messageType === "text";
          if (isText && !data.content?.trim()) {
            if (ack) ack({ success: false, error: "Message content is required" });
            return;
          }
          if (!isText && !data.mediaUrl) {
            if (ack) ack({ success: false, error: "Media URL is required" });
            return;
          }
          data.content = (data.content || "").toString();

          const message = await this.createMessage(socket.userId!, data);
          const populatedMessage = await Message.findById(String(message._id))
            .populate("sender", "name email avatar")
            .populate({
              path: "replyTo",
              select: "content sender messageType mediaUrl fileName",
              populate: { path: "sender", select: "name email avatar" }
            });

          // Emit to conversation participants
          this.io.to(data.conversationId).emit("new_message", populatedMessage);

          // Update conversation last message
          await this.updateConversationLastMessage(data.conversationId, String(message._id));

          // If conversation was soft-deleted by any participant, make it visible again
          try {
            await Conversation.findByIdAndUpdate(data.conversationId, { $set: { deletedBy: [] } });
          } catch {}

          // Increment unread counters for other participants
          await this.incrementUnreadForOthers(data.conversationId, socket.userId!);
          // Notify participants about unread counters update
          this.io.to(data.conversationId).emit("unread_counts_updated", {
            conversationId: data.conversationId,
          });

          // Mark message as delivered to online users
          await this.markMessageAsDelivered(String(message._id), data.conversationId);

          if (ack) ack({ success: true, message: populatedMessage });
        } catch (error) {
          if (ack) ack({ success: false, error: "Failed to send message" });
          socket.emit("message_error", { error: "Failed to send message" });
        }
      });

      // Handle message reactions
      socket.on("react_to_message", async (data: {
        messageId: string;
        reactionType: string;
        emoji: string;
      }) => {
        try {
          let messageDoc;
          
          if (data.reactionType === 'remove') {
            // Remove reaction
            messageDoc = await this.removeMessageReaction(
              data.messageId,
              socket.userId!
            );
          } else {
            // Add reaction
            messageDoc = await this.addMessageReaction(
              data.messageId,
              socket.userId!,
              data.reactionType,
              data.emoji
            );
          }
          
          const convId = (messageDoc as any)?.conversationId?.toString?.();
          if (convId) {
            this.io.to(convId).emit("message_reaction", {
              messageId: data.messageId,
              userId: socket.userId,
              reactionType: data.reactionType,
              emoji: data.emoji,
            });
          }
        } catch (error) {
          socket.emit("reaction_error", { error: "Failed to handle reaction" });
        }
      });

      // Handle message read
      socket.on("mark_as_read", async (data: { messageId?: string; conversationId?: string }) => {
        try {
          if (data.conversationId) {
            await this.markConversationAsRead(data.conversationId, socket.userId!);
            socket.emit("conversation_read", { conversationId: data.conversationId });
            this.io.to(data.conversationId).emit("unread_counts_updated", { conversationId: data.conversationId });
          } else if (data.messageId) {
            await this.markMessageAsRead(data.messageId, socket.userId!);
            socket.emit("message_read", { messageId: data.messageId });
          }
        } catch (error) {
          // Emit error back safely; do not throw
          socket.emit("read_error", { error: "Failed to mark as read" });
        }
      });

      // Handle message edit
      socket.on("edit_message", async (data: { messageId: string; content: string }) => {
        try {
          if (!data.content || !data.content.trim()) throw new Error("Empty content");
          const message = await this.editMessage(data.messageId, socket.userId!, data.content.trim());
          this.io.to(String(message.conversationId)).emit("message_edited", {
            messageId: data.messageId,
            content: data.content,
            editedAt: message.editedAt,
          });
        } catch (error) {
          socket.emit("edit_error", { error: "Failed to edit message" });
        }
      });

      // Handle message deletion
      socket.on("delete_message", async (data: { messageId: string }) => {
        try {
          const message = await this.deleteMessage(data.messageId, socket.userId!);
          this.io.to(String(message.conversationId)).emit("message_deleted", {
            messageId: data.messageId,
          });
        } catch (error) {
          socket.emit("delete_error", { error: "Failed to delete message" });
        }
      });

      // Handle message forwarding
      socket.on("forward_message", async (data: {
        messageId: string;
        targetConversationId: string;
      }, ack?: (res: any) => void) => {
        try {
          // Check if user is participant in both source and target conversations
          const sourceMessage = await Message.findById(data.messageId).populate("sender", "name email avatar");
          if (!sourceMessage) {
            if (ack) ack({ success: false, error: "Message not found" });
            return;
          }

          const isSourceMember = await this.isParticipant(String(sourceMessage.conversationId), socket.userId!);
          const isTargetMember = await this.isParticipant(data.targetConversationId, socket.userId!);
          
          if (!isSourceMember || !isTargetMember) {
            if (ack) ack({ success: false, error: "Access denied" });
            return;
          }

          // Create forward message data
          const forwardData = {
            conversationId: data.targetConversationId,
            content: sourceMessage.content,
            messageType: sourceMessage.messageType,
            mediaUrl: sourceMessage.mediaUrl,
            fileName: sourceMessage.fileName,
            fileSize: sourceMessage.fileSize,
            duration: sourceMessage.duration,
            isForwarded: true,
            originalMessageId: sourceMessage._id,
            originalSenderId: sourceMessage.sender._id,
            replyTo: undefined, // Clear any existing reply
          };

          // Create and send the forwarded message
          const forwardedMessage = await this.createMessage(socket.userId!, forwardData);
          const populatedForwardedMessage = await Message.findById(String(forwardedMessage._id))
            .populate("sender", "name email avatar")
            .populate({
              path: "replyTo",
              select: "content sender messageType mediaUrl fileName",
              populate: { path: "sender", select: "name email avatar" }
            });

          // Emit to target conversation participants
          this.io.to(data.targetConversationId).emit("new_message", populatedForwardedMessage);

          // Update conversation last message
          await this.updateConversationLastMessage(data.targetConversationId, String(forwardedMessage._id));

          // If conversation was soft-deleted by any participant, make it visible again
          try {
            await Conversation.findByIdAndUpdate(data.targetConversationId, { $set: { deletedBy: [] } });
          } catch {}

          // Increment unread counters for other participants
          await this.incrementUnreadForOthers(data.targetConversationId, socket.userId!);
          
          // Notify participants about unread counters update
          this.io.to(data.targetConversationId).emit("unread_counts_updated", {
            conversationId: data.targetConversationId,
          });

          // Mark message as delivered to online users
          await this.markMessageAsDelivered(String(forwardedMessage._id), data.targetConversationId);

          if (ack) ack({ success: true, message: populatedForwardedMessage });
        } catch (error) {
          console.error("Forward message error:", error);
          if (ack) ack({ success: false, error: "Failed to forward message" });
          socket.emit("forward_error", { error: "Failed to forward message" });
        }
      });

      // --- WebRTC signaling ---
      socket.on("call_invite", async (data: { conversationId: string; callType: "audio" | "video" }) => {
        if (!(await this.isParticipant(data.conversationId, socket.userId!))) return;
        // Blocked users are not allowed to initiate calls
        try {
          const conversation = await Conversation.findById(data.conversationId);
          if (conversation && (conversation as any).blockedBy && (conversation as any).blockedBy.includes(socket.userId!)) {
            socket.emit("call_error", { error: "You are blocked from calling in this conversation", conversationId: data.conversationId });
            return;
          }
        } catch {}
        socket.to(data.conversationId).emit("call_invite", {
          conversationId: data.conversationId,
          fromUserId: socket.userId,
          callType: data.callType,
          at: new Date().toISOString(),
        });
      });

      socket.on("call_cancelled", async (data: { conversationId: string }) => {
        if (!(await this.isParticipant(data.conversationId, socket.userId!))) return;
        socket.to(data.conversationId).emit("call_cancelled", {
          conversationId: data.conversationId,
          fromUserId: socket.userId,
          at: new Date().toISOString(),
        });
      });

      socket.on("call_accepted", async (data: { conversationId: string }) => {
        if (!(await this.isParticipant(data.conversationId, socket.userId!))) return;
        socket.to(data.conversationId).emit("call_accepted", {
          conversationId: data.conversationId,
          fromUserId: socket.userId,
          at: new Date().toISOString(),
        });
      });

      socket.on("call_rejected", async (data: { conversationId: string; reason?: string }) => {
        if (!(await this.isParticipant(data.conversationId, socket.userId!))) return;
        socket.to(data.conversationId).emit("call_rejected", {
          conversationId: data.conversationId,
          fromUserId: socket.userId,
          reason: data.reason,
          at: new Date().toISOString(),
        });
      });

      socket.on("webrtc_signal", async (data: { conversationId: string; signal: any }) => {
        if (!(await this.isParticipant(data.conversationId, socket.userId!))) return;
        socket.to(data.conversationId).emit("webrtc_signal", {
          conversationId: data.conversationId,
          fromUserId: socket.userId,
          signal: data.signal,
        });
      });

      // Defensive: ensure sockets are in the conversation room before forwarding signals
      // This helps when a user opened the site after call started
      socket.on("join_call_room", async (data: { conversationId: string }) => {
        if (!(await this.isParticipant(data.conversationId, socket.userId!))) return;
        socket.join(data.conversationId);
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.userId}`);
        const set = this.connectedUsers.get(socket.userId!);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) {
            this.connectedUsers.delete(socket.userId!);
            this.updateUserPresence(socket.userId!, false);
            // Optionally notify peers to stop any ongoing call UI for this user
            // We don't force-end calls here to avoid interrupting multi-device sessions
          } else {
            this.connectedUsers.set(socket.userId!, set);
          }
        }
      });
    });
  }

  private async updateUserPresence(userId: string, isOnline: boolean, socketId?: string) {
    try {
      await UserPresence.findOneAndUpdate(
        { userId },
        {
          isOnline,
          lastSeen: new Date(),
          socketId: socketId || null,
        },
        { upsert: true }
      );

      // Emit presence update to user's contacts
      const userConversations = await Conversation.find({ participants: userId });
      userConversations.forEach((conversation) => {
        this.io.to((conversation as any)._id.toString()).emit("user_presence", {
          userId,
          isOnline,
          lastSeen: new Date(),
        });
      });
    } catch (error) {
      console.error("Error updating user presence:", error);
    }
  }

  private async joinUserConversations(userId: string) {
    try {
      const conversations = await Conversation.find({ participants: userId });
      const sockets = this.connectedUsers.get(userId);
      if (sockets) {
        sockets.forEach((socketId) => {
          const s = this.io.sockets.sockets.get(socketId);
          if (s) {
            conversations.forEach((conversation) => {
              s.join((conversation as any)._id.toString());
            });
          }
        });
      }
    } catch (error) {
      console.error("Error joining conversations:", error);
    }
  }

  private async createMessage(senderId: string, data: any) {
    if (!data?.content && !data?.mediaUrl) {
      throw new Error("Message must have content or media");
    }
    const content = (data.content || "").toString().trim();
    const message = new Message({
      conversationId: data.conversationId,
      sender: senderId,
      content,
      messageType: data.messageType || "text",
      mediaUrl: data.mediaUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      duration: data.duration,
      replyTo: data.replyTo || undefined,
    });

    return await message.save();
  }

  private async updateConversationLastMessage(conversationId: string, messageId: string) {
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: messageId,
      lastMessageTime: new Date(),
    });
  }

  private async updateConversationLastMessageAfterDelete(conversationId: string, deletedMessageId: string) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return;

    // If the deleted message was the last message, find the previous non-deleted message
    if (conversation.lastMessage?.toString() === deletedMessageId) {
      const previousMessage = await Message.findOne({
        conversationId,
        _id: { $ne: deletedMessageId },
        isDeleted: false
      }).sort({ createdAt: -1 });

      if (previousMessage) {
        // Update conversation with the previous message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: previousMessage._id,
          lastMessageTime: previousMessage.createdAt,
        });
      } else {
        // No more messages in conversation, clear lastMessage
        await Conversation.findByIdAndUpdate(conversationId, {
          $unset: { lastMessage: "", lastMessageTime: "" },
        });
      }
    }
  }

  private async markMessageAsDelivered(messageId: string, conversationId: string) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return;

    const onlineParticipants = conversation.participants.filter(
      (participant) => this.connectedUsers.has(participant.toString())
    );

    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deliveredTo: { $each: onlineParticipants } },
    });
  }

  private async addMessageReaction(messageId: string, userId: string, reactionType: string, emoji: string) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");

    // Use plain object path update to avoid TS Map typing issues
    await Message.updateOne(
      { _id: messageId },
      { $set: { [`reactions.${userId}`]: { type: reactionType, emoji } } }
    );
    return await Message.findById(messageId);
  }

  private async removeMessageReaction(messageId: string, userId: string) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");

    // Remove the user's reaction
    await Message.updateOne(
      { _id: messageId },
      { $unset: { [`reactions.${userId}`]: "" } }
    );
    return await Message.findById(messageId);
  }

  private async markMessageAsRead(messageId: string, userId: string) {
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { readBy: userId },
    });
  }

  private async markConversationAsRead(conversationId: string, userId: string) {
    // Mark all messages in this conversation as read for this user
    await Message.updateMany(
      { conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    // Reset unread counter for this user
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCount.${userId}`]: 0 },
    });
    // notify participants to sync unread counters quickly
    this.io.to(conversationId).emit('unread_counts_updated', { conversationId });
  }

  private async editMessage(messageId: string, userId: string, content: string) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");
    if (message.sender.toString() !== userId) throw new Error("Unauthorized");

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    return await message.save();
  }

  private async deleteMessage(messageId: string, userId: string) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");
    if (message.sender.toString() !== userId) throw new Error("Unauthorized");

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    // Update conversation's last message if this was the last message
    await this.updateConversationLastMessageAfterDelete(message.conversationId, messageId);
    
    return message;
  }

  public getIO() {
    return this.io;
  }

  private async incrementUnreadForOthers(conversationId: string, senderId: string) {
    const conv = await Conversation.findById(conversationId);
    if (!conv) return;
    const inc: any = {};
    (conv.participants as any[]).forEach((p: any) => {
      const id = p.toString();
      if (id !== senderId) {
        inc[`unreadCount.${id}`] = 1;
      }
    });
    if (Object.keys(inc).length) {
      await Conversation.findByIdAndUpdate(conversationId, { $inc: inc });
    }
  }

  private async markUndeliveredAsDeliveredForUser(userId: string) {
    // Find messages in conversations where user is a participant but not in deliveredTo
    const conversations = await Conversation.find({ participants: userId }).select("_id");
    const conversationIds = conversations.map((c) => (c as any)._id);
    if (conversationIds.length === 0) return;
    await Message.updateMany(
      { conversationId: { $in: conversationIds }, deliveredTo: { $ne: userId } },
      { $addToSet: { deliveredTo: userId } }
    );
  }

  private async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const exists = await Conversation.exists({ _id: conversationId, participants: userId });
    return !!exists;
  }
}
