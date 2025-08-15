import express from "express";
import { isLoggedIn } from "../app/middlewares/AuthMiddlewere";
import { ChatController } from "../app/controllers/ChatController";
import { upload } from "../app/middlewares/multerMiddleware";

const router = express.Router();

// All routes require authentication
router.use(isLoggedIn);

// Conversation routes
router.get("/conversations", ChatController.getConversations);
router.post("/conversations", ChatController.createConversation);
router.get("/conversations/:conversationId", ChatController.getConversation);
router.put("/conversations/:conversationId", ChatController.updateConversation);
router.post("/conversations/:conversationId/participants", ChatController.manageParticipants);
router.put("/conversations/:conversationId/admins", ChatController.updateAdmins);

// Message routes
router.get("/conversations/:conversationId/messages", ChatController.getMessages);
router.get("/conversations/:conversationId/media", ChatController.getConversationMedia);

// Media upload route
router.post("/media", upload.single("file"), ChatController.uploadMedia);

// Mute/Block/Leave routes
router.put("/conversations/:conversationId/mute", ChatController.muteConversation);
router.put("/conversations/:conversationId/block", ChatController.blockUser);
router.post("/conversations/:conversationId/leave", ChatController.leaveGroup);
// Soft delete (hide) a conversation for current user
router.delete("/conversations/:conversationId", ChatController.deleteConversationForUser);

// User routes
router.get("/users/online", ChatController.getOnlineUsers);
router.get("/users/search", ChatController.searchUsers);

export default router;
