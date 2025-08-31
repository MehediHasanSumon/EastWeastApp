import { Request, Response } from "express";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import UserPresence from "../models/UserPresence";
import Users from "../models/Users";
import path from "path";
import type { Request as ExpressRequest } from "express";

export class ChatController {
  // Get all conversations for a user (excluding those the user deleted)
  static async getConversations(req: Request, res: Response) {
    try {
      const userId = ((req as any).user?._id || (req as any).user?.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const conversations = await Conversation.find({ participants: userId, deletedBy: { $ne: userId } })
        .populate("participants", "name email avatar")
        .populate("lastMessage")
        .populate("admins", "name email avatar")
        .sort({ lastMessageTime: -1 });

      // Get user presence for all participants
      const participantIds = conversations.flatMap(conv => 
        conv.participants.map(p => p._id.toString())
      );
      
      const userPresence = await UserPresence.find({ 
        userId: { $in: participantIds } 
      });

      const presenceMap = new Map(
        userPresence.map(presence => [presence.userId.toString(), presence])
      );

      const conversationsWithPresence = conversations.map(conversation => {
        const participantsWithPresence = conversation.participants.map(participant => ({
          ...participant.toObject(),
          presence: presenceMap.get(participant._id.toString()) || null
        }));

        return {
          ...conversation.toObject(),
          participants: participantsWithPresence
        };
      });

      res.json({
        success: true,
        data: conversationsWithPresence
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch conversations",
        error: error.message
      });
    }
  }

  // Upload media (images/files/voice) to local server and return public URL
  static async uploadMedia(req: ExpressRequest, res: Response) {
    try {
      const userId = ((req as any).user?._id || (req as any).user?.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const mimeType = file.mimetype || "application/octet-stream";
      let messageType: "image" | "file" | "voice" = "file";
      if (mimeType.startsWith("image/")) messageType = "image";
      else if (mimeType.startsWith("audio/")) messageType = "voice";

      // Build a public URL: /uploads/chat/<filename>
      const relPath = `/uploads/chat/${path.basename(file.path)}`;
      const publicUrl = `${req.protocol}://${req.get("host")}${relPath}`;

      return res.status(201).json({
        success: true,
        data: {
          url: publicUrl,
          publicId: path.basename(file.path),
          fileName: file.originalname,
          fileSize: file.size,
          mimeType,
          messageType,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload media",
        error: error.message,
      });
    }
  }
  // Create a new conversation
  static async createConversation(req: Request, res: Response) {
    try {
      const userId = ((req as any).user?._id || (req as any).user?.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const { participants, type, name, avatar } = req.body;

      // Normalize participant list: include current user, dedupe, remove self-duplicates
      const normalized = Array.from(new Set([...(participants || []), userId]));

      // For direct conversations, ensure exactly 2 distinct participants (user + other)
      if (type === "direct" && normalized.length !== 2) {
        return res.status(400).json({
          success: false,
          message: "Direct conversations must have exactly 2 participants"
        });
      }

      // Check if direct conversation already exists
      if (type === "direct") {
        const existingConversation = await Conversation.findOne({
          type: "direct",
          participants: { $all: normalized }
        });

        if (existingConversation) {
          return res.json({
            success: true,
            data: existingConversation,
            message: "Conversation already exists"
          });
        }
      }

      // Use normalized participants

      const conversation = new Conversation({
        participants: normalized,
        type,
        name: type === "group" ? name : undefined,
        avatar,
        admins: type === "group" ? [userId] : undefined
      });

      await conversation.save();

      const populatedConversation = await Conversation.findById(conversation._id)
        .populate("participants", "name email avatar")
        .populate("admins", "name email avatar");

      res.status(201).json({
        success: true,
        data: populatedConversation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create conversation",
        error: error.message
      });
    }
  }

  // Get messages for a conversation
  static async getMessages(req: Request, res: Response) {
    try {
      const userId = ((req as any).user?._id || (req as any).user?.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Check if user is part of the conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.some((p: any) => p.toString() === userId)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this conversation"
        });
      }

      const skip = (Number(page) - 1) * Number(limit);

      const messages = await Message.find({
        conversationId
      })
        .populate("sender", "name email avatar")
        .populate("replyTo", "content sender")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const totalMessages = await Message.countDocuments({
        conversationId
      });

      res.json({
        success: true,
        data: messages.reverse(),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalMessages / Number(limit)),
          totalMessages,
          hasMore: skip + messages.length < totalMessages
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch messages",
        error: error.message
      });
    }
  }

  // Get conversation media (images/files)
  static async getConversationMedia(req: Request, res: Response) {
    try {
      const userId = ((req as any).user?._id || (req as any).user?.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { conversationId } = req.params;
      const { type = "all", page = 1, limit = 24 } = req.query as any;

      // Check membership
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.some((p: any) => p.toString() === userId)) {
        return res.status(403).json({ success: false, message: "Access denied to this conversation" });
      }

      const filter: any = {
        conversationId,
        mediaUrl: { $exists: true, $ne: null },
      };

      if (type === "image") {
        filter.messageType = "image";
      } else if (type === "file") {
        filter.messageType = { $in: ["file", "voice", "video"] };
      }

      const skip = (Number(page) - 1) * Number(limit);

      const items = await Message.find(filter)
        .select("mediaUrl fileName fileSize messageType createdAt sender")
        .populate("sender", "name email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Message.countDocuments(filter);

      return res.json({
        success: true,
        data: items,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          total,
          hasMore: skip + items.length < total,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch media",
        error: error.message,
      });
    }
  }

  // Get conversation details
  static async getConversation(req: Request, res: Response) {
    try {
      const userId = ((req as any).user?._id || (req as any).user?.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const { conversationId } = req.params;

      const conversation = await Conversation.findOne({ _id: conversationId, deletedBy: { $ne: userId } })
        .populate("participants", "name email avatar")
        .populate("lastMessage")
        .populate("admins", "name email avatar");

      if (!conversation || !conversation.participants.some((p: any) => p._id.toString() === userId)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this conversation"
        });
      }

      // Get user presence for participants
      const participantIds = conversation.participants.map(p => p._id.toString());
      const userPresence = await UserPresence.find({ userId: { $in: participantIds } });

      const presenceMap = new Map(
        userPresence.map(presence => [presence.userId.toString(), presence])
      );

      const participantsWithPresence = conversation.participants.map(participant => ({
        ...participant.toObject(),
        presence: presenceMap.get(participant._id.toString()) || null
      }));

      const conversationWithPresence = {
        ...conversation.toObject(),
        participants: participantsWithPresence
      };

      res.json({
        success: true,
        data: conversationWithPresence
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch conversation",
        error: error.message
      });
    }
  }

  // Update conversation (for group chats)
  static async updateConversation(req: Request, res: Response) {
    try {
      const userId = ((req as any).user?._id || (req as any).user?.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const { conversationId } = req.params;
      const { name, avatar } = req.body;

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found"
        });
      }

      // Check if user is admin (for group chats)
      if (conversation.type === "group" && !(conversation.admins || []).some((a: any) => a.toString() === userId)) {
        return res.status(403).json({
          success: false,
          message: "Only admins can update group details"
        });
      }

      const updatedConversation = await Conversation.findByIdAndUpdate(
        conversationId,
        { name, avatar },
        { new: true }
      ).populate("participants", "name email avatar")
       .populate("admins", "name email avatar");

      res.json({
        success: true,
        data: updatedConversation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update conversation",
        error: error.message
      });
    }
  }

  // Add/remove participants (for group chats)
  static async manageParticipants(req: Request, res: Response) {
    try {
      const userId = ((req as any).user?._id || (req as any).user?.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const { conversationId } = req.params;
      const { action, participantIds } = req.body; // action: 'add' | 'remove'

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found"
        });
      }

      // Check if user is admin (for group chats)
      if (conversation.type === "group" && !(conversation.admins || []).some((a: any) => a.toString() === userId)) {
        return res.status(403).json({
          success: false,
          message: "Only admins can manage participants"
        });
      }

      if (action === "add") {
        conversation.participants = [...new Set([...conversation.participants, ...participantIds])];
      } else if (action === "remove") {
        conversation.participants = conversation.participants.filter(
          p => !participantIds.includes(p.toString())
        );
      }

      await conversation.save();

      const updatedConversation = await Conversation.findById(conversationId)
        .populate("participants", "name email avatar")
        .populate("admins", "name email avatar");

      res.json({
        success: true,
        data: updatedConversation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to manage participants",
        error: error.message
      });
    }
  }

  // Add/remove admins (for group chats)
  static async updateAdmins(req: Request, res: Response) {
    try {
      const userId = ((req as any).user?._id || (req as any).user?.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { conversationId } = req.params;
      const { action, memberId } = req.body as { action: 'add' | 'remove'; memberId: string };

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation not found" });
      }

      if (conversation.type !== 'group') {
        return res.status(400).json({ success: false, message: "Admins can only be managed in group conversations" });
      }

      // Only admins can update admins
      if (!(conversation.admins || []).some((a: any) => a.toString() === userId)) {
        return res.status(403).json({ success: false, message: "Only admins can manage admins" });
      }

      // Member must be a participant
      if (!conversation.participants.some((p: any) => p.toString() === memberId)) {
        return res.status(400).json({ success: false, message: "User is not a participant of this conversation" });
      }

      const isAlreadyAdmin = (conversation.admins || []).some((a: any) => a.toString() === memberId);

      if (action === 'add') {
        if (!isAlreadyAdmin) {
          conversation.admins = [...(conversation.admins || []), memberId as any];
        }
      } else if (action === 'remove') {
        if (!isAlreadyAdmin) {
          return res.status(400).json({ success: false, message: "User is not an admin" });
        }
        // Ensure at least one admin remains
        const remaining = (conversation.admins || []).filter((a: any) => a.toString() !== memberId);
        if (remaining.length === 0) {
          return res.status(400).json({ success: false, message: "At least one admin is required" });
        }
        conversation.admins = remaining as any;
      }

      await conversation.save();

      const updated = await Conversation.findById(conversationId)
        .populate('participants', 'name email avatar')
        .populate('admins', 'name email avatar');

      res.json({ success: true, data: updated });
      return;
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to update admins", error: error.message });
      return;
    }
  }

  // Get online users
  static async getOnlineUsers(req: Request, res: Response) {
    try {
      const onlineUsers = await UserPresence.find({ isOnline: true })
        .populate("userId", "name email avatar");

      res.json({
        success: true,
        data: onlineUsers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch online users",
        error: error.message
      });
    }
  }

  // Search users for new conversations
  static async searchUsers(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query is required"
        });
      }

      const users = await Users.find({
        $and: [
          { _id: { $ne: userId } },
          {
            $or: [
              { name: { $regex: query, $options: "i" } },
              { email: { $regex: query, $options: "i" } }
            ]
          }
        ]
      }).select("name email avatar");

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to search users",
        error: error.message
      });
    }
  }

  // Mute/Unmute conversation
  static async muteConversation(req: Request, res: Response) {
    try {
      const userId = ((req as any).user._id || (req as any).user.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { conversationId } = req.params;
      const { mute } = req.body; // true to mute, false to unmute

      // Check if user is participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation not found" });
      }

      // Update mute status
      if (!conversation.mutedBy) {
        conversation.mutedBy = new Map();
      }
      conversation.mutedBy.set(userId.toString(), mute);
      await conversation.save();

      res.status(200).json({
        success: true,
        message: mute ? "Conversation muted" : "Conversation unmuted",
        data: { muted: mute },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update mute status",
        error: error.message,
      });
    }
  }

  // Block/Unblock user (for direct conversations)
  static async blockUser(req: Request, res: Response) {
    try {
      const userId = ((req as any).user._id || (req as any).user.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { conversationId } = req.params;
      const { block } = req.body; // true to block, false to unblock

      // Check if it's a direct conversation and user is participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        type: "direct",
      });

      if (!conversation) {
        return res.status(404).json({ success: false, message: "Direct conversation not found" });
      }

      // Update block status
      if (block) {
        if (!conversation.blockedBy.includes(userId)) {
          conversation.blockedBy.push(userId);
        }
      } else {
        conversation.blockedBy = conversation.blockedBy.filter(
          (blockedUserId) => blockedUserId.toString() !== userId.toString()
        );
      }

      await conversation.save();

      res.status(200).json({
        success: true,
        message: block ? "User blocked" : "User unblocked",
        data: { blocked: block },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update block status",
        error: error.message,
      });
    }
  }

  // Leave group conversation
  static async leaveGroup(req: Request, res: Response) {
    try {
      const userId = ((req as any).user._id || (req as any).user.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { conversationId } = req.params;

      // Check if it's a group conversation and user is participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        type: "group",
      });

      if (!conversation) {
        return res.status(404).json({ success: false, message: "Group conversation not found" });
      }

      // Remove user from participants
      conversation.participants = conversation.participants.filter(
        (participantId) => participantId.toString() !== userId.toString()
      );

      // If user was admin, remove from admins
      if (conversation.admins) {
        conversation.admins = conversation.admins.filter(
          (adminId) => adminId.toString() !== userId.toString()
        );

        // If no admins left and there are still participants, make the first participant an admin
        if (conversation.admins.length === 0 && conversation.participants.length > 0) {
          conversation.admins = [conversation.participants[0]];
        }
      }

      await conversation.save();

      res.status(200).json({
        success: true,
        message: "Left group successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to leave group",
        error: error.message,
      });
    }
  }

  // Soft delete/hide conversation like Facebook Messenger (per-user)
  static async deleteConversationForUser(req: Request, res: Response) {
    try {
      const userId = ((req as any).user._id || (req as any).user.id)?.toString();
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const { conversationId } = req.params;
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation not found" });
      }
      // Must be a participant to delete/hide
      if (!conversation.participants.some((p: any) => p.toString() === userId)) {
        return res.status(403).json({ success: false, message: "Not a participant" });
      }
      const already = (conversation as any).deletedBy?.some?.((p: any) => p.toString() === userId) || false;
      if (!already) {
        (conversation as any).deletedBy = [ ...(conversation as any).deletedBy || [], userId as any ];
        await conversation.save();
      }
      return res.json({ success: true, message: "Conversation hidden" });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: "Failed to delete conversation", error: error.message });
    }
  }
}
