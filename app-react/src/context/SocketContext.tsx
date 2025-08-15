import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { SOCKET_EVENTS, socketService, type ConversationData, type MessageData, type SocketUser } from "../service/socketService";

interface SocketContextType {
  isConnected: boolean;
  conversations: ConversationData[];
  activeConversation: ConversationData | null;
  messages: MessageData[];
  typingUsers: { [conversationId: string]: SocketUser[] };
  onlineUsers: string[];
  sendMessage: (content: string, type?: "text" | "image" | "file" | "note") => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const user = useSelector((state: any) => state.auth.user);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: string]: SocketUser[] }>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      const socketUser: SocketUser = {
        id: user.id || user._id,
        name: user.name,
        avatar: user.profile_picture?.image || "",
        email: user.email,
      };

      socketService
        .connect(socketUser)
        .then(() => {
          setIsConnected(true);
          setupSocketListeners();
        })
        .catch((error) => {
          console.error("Failed to connect to socket:", error);
        });
    }

    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [user]);

  const setupSocketListeners = () => {
    // New message received
    socketService.on(SOCKET_EVENTS.NEW_MESSAGE, (message: MessageData) => {
      setMessages((prev) => [...prev, message]);

      // Update conversation's last message
      setConversations((prev) =>
        prev.map((conv) => (conv.id === message.conversationId ? { ...conv, lastMessage: message } : conv))
      );
    });

    // Message delivered confirmation
    socketService.on(SOCKET_EVENTS.MESSAGE_DELIVERED, (data) => {
      console.log("Message delivered:", data);
    });

    // Message read status
    socketService.on(SOCKET_EVENTS.MESSAGE_READ, (data) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.messageId ? { ...msg, readBy: [...msg.readBy, data.userId] } : msg))
      );
    });

    // Typing indicators
    socketService.on(SOCKET_EVENTS.USER_TYPING, (data) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.conversationId]: data.isTyping
          ? [
              ...(prev[data.conversationId] || []).filter((u) => u.id !== data.userId),
              { id: data.userId, name: data.userName } as SocketUser,
            ]
          : (prev[data.conversationId] || []).filter((u) => u.id !== data.userId),
      }));
    });

    // User online/offline status
    socketService.on(SOCKET_EVENTS.USER_ONLINE, (data) => {
      setOnlineUsers((prev) => [...prev.filter((id) => id !== data.userId), data.userId]);
    });

    socketService.on(SOCKET_EVENTS.USER_OFFLINE, (data) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    });
  };

  const sendMessage = (content: string, type: "text" | "image" | "file" | "note" = "text") => {
    if (activeConversation && content.trim()) {
      const tempId = Date.now().toString();
      socketService.sendMessage({
        conversationId: activeConversation.id,
        content,
        type,
        metadata: { tempId },
      });

      // Optimistically add message to UI
      const optimisticMessage: MessageData = {
        id: tempId,
        conversationId: activeConversation.id,
        sender: {
          id: user.id || user._id,
          name: user.name,
          avatar: user.profile_picture?.image || "",
          email: user.email,
        },
        content,
        type,
        createdAt: new Date(),
        readBy: [user.id || user._id],
      };

      setMessages((prev) => [...prev, optimisticMessage]);
    }
  };

  const joinConversation = (conversationId: string) => {
    socketService.joinRoom(conversationId);
    const conversation = conversations.find((c) => c.id === conversationId);
    setActiveConversation(conversation || null);

    // Load messages for this conversation (you might want to implement this API call)
    // loadConversationMessages(conversationId);
  };

  const leaveConversation = (conversationId: string) => {
    socketService.leaveRoom(conversationId);
    if (activeConversation?.id === conversationId) {
      setActiveConversation(null);
      setMessages([]);
    }
  };

  const startTyping = (conversationId: string) => {
    socketService.startTyping(conversationId);
  };

  const stopTyping = (conversationId: string) => {
    socketService.stopTyping(conversationId);
  };

  const value: SocketContextType = {
    isConnected,
    conversations,
    activeConversation,
    messages,
    typingUsers,
    onlineUsers,
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
