import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { SOCKET_EVENTS, socketService, type ConversationData, type MessageData, type SocketUser } from "../service/socketService";
import { ChatService, type IConversation } from "../service/chatService";

interface SocketContextType {
  isConnected: boolean;
  conversations: ConversationData[];
  activeConversation: ConversationData | null;
  messages: MessageData[];
  typingUsers: { [conversationId: string]: SocketUser[] };
  onlineUsers: string[];
  unreadCount: number;
  sendMessage: (content: string, type?: "text" | "image" | "file" | "note") => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  loadConversations: () => Promise<void>;
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
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate total unread count
  const calculateUnreadCount = (conversations: ConversationData[]) => {
    if (!user) return 0;
    
    return conversations.reduce((total, conversation) => {
      const userId = user.id || user._id;
      const userUnreadCount = conversation.unreadCount?.[userId] || 0;
      return total + userUnreadCount;
    }, 0);
  };

  // Load conversations from API
  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const apiConversations = await ChatService.getConversations();
      
      // Convert API conversations to SocketContext format
      const socketConversations: ConversationData[] = apiConversations.map(conv => ({
        id: conv._id,
        name: conv.name,
        participants: conv.participants.map(p => ({
          id: p._id,
          name: p.name,
          avatar: p.avatar || "",
          email: p.email
        })),
        lastMessage: conv.lastMessage ? {
          id: conv.lastMessage._id,
          conversationId: conv.lastMessage.conversationId,
          sender: {
            id: conv.lastMessage.sender._id,
            name: conv.lastMessage.sender.name,
            avatar: conv.lastMessage.sender.avatar || "",
            email: conv.lastMessage.sender.email
          },
          content: conv.lastMessage.content,
          type: conv.lastMessage.messageType as any,
          createdAt: new Date(conv.lastMessage.createdAt),
          readBy: conv.lastMessage.readBy || []
        } : undefined,
        unreadCount: conv.unreadCount || {},
        isGroup: conv.type === "group"
      }));
      
      setConversations(socketConversations);
      
      // Calculate and set unread count
      const totalUnread = calculateUnreadCount(socketConversations);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  // Update unread count when conversations change
  useEffect(() => {
    const totalUnread = calculateUnreadCount(conversations);
    setUnreadCount(totalUnread);
  }, [conversations]);

  useEffect(() => {
    if (user && user.id) { // Make sure user has a valid ID
      const socketUser: SocketUser = {
        id: user.id || user._id,
        name: user.name,
        avatar: user.profile_picture || "",
        email: user.email,
      };

      // Load conversations first
      loadConversations();

      // Add a small delay to ensure authentication is complete
      const connectTimeout = setTimeout(() => {
        socketService
          .connect(socketUser)
          .then(() => {
            setIsConnected(true);
            setupSocketListeners();
          })
          .catch((error) => {
            console.error("Failed to connect to socket:", error);
            // Don't set isConnected to false here, let it retry
          });
      }, 1000); // Wait 1 second for authentication to complete

      return () => {
        clearTimeout(connectTimeout);
        socketService.disconnect();
        setIsConnected(false);
      };
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

      // Update conversation's last message and increment unread count
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === message.conversationId) {
            const isCurrentUser = message.sender.id === (user?.id || user?._id);
            const newUnreadCount = isCurrentUser ? conv.unreadCount : (conv.unreadCount || 0) + 1;
            
            return { 
              ...conv, 
              lastMessage: message,
              unreadCount: newUnreadCount
            };
          }
          return conv;
        })
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

      // Update unread count when message is read
      if (data.userId === (user?.id || user?._id)) {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === data.conversationId) {
              return { ...conv, unreadCount: Math.max(0, (conv.unreadCount || 0) - 1) };
            }
            return conv;
          })
        );
      }
    });

    // Listen for unread count updates from backend
    socketService.on("unread_counts_updated", (data: any) => {
      console.log("Unread counts updated:", data);
      // Reload conversations to get updated unread counts
      loadConversations();
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
          avatar: user.profile_picture || "",
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

    // Mark conversation as read when joining
    if (conversation) {
      markConversationAsRead(conversationId);
    }

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

  const markConversationAsRead = (conversationId: string) => {
    // Update local state immediately
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          const userId = user?.id || user?._id;
          return { 
            ...conv, 
            unreadCount: { 
              ...conv.unreadCount, 
              [userId]: 0 
            } 
          };
        }
        return conv;
      })
    );

    // Emit socket event to mark messages as read
    socketService.markMessageAsRead(conversationId, '');
  };

  const value: SocketContextType = {
    isConnected,
    conversations,
    activeConversation,
    messages,
    typingUsers,
    onlineUsers,
    unreadCount,
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    markConversationAsRead,
    loadConversations,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
