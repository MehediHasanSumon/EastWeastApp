import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Search,
  MessageCircle,
  User,
  Sparkles,
  Users
} from "lucide-react";
import {
  addMessage,
  addMessageReaction,
  addSelectedUser,
  clearError,
  clearSelectedUsers,
  createConversation,
  deleteMessage,
  fetchConversation,
  fetchConversations,
  fetchMessages,
  removeSelectedUser,
  setCurrentConversation,
  setTypingUser,
  updateMessage,
  updateUserPresence,
} from "../app/features/chat/chatSlice";
import type { AppDispatch, RootState } from "../app/Store";
import ChatInterface from "../components/Chat/ChatInterface";
import ConversationList from "../components/Chat/ConversationList";
import NewConversationModal from "../components/Chat/NewConversationModal";
import type { IUser, IConversation } from "../service/chatService";
import chatSocketService from "../socket/chatSocket";
import DeleteDialog from "../components/ui/DeleteDialog";
import AdminLayout from "../layouts/Admin/AdminLayout";

const MessengerPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { conversations, currentConversation, messages, loading, error, typingUsers, selectedUsers, searchResults, pagination } = useSelector(
    (state: RootState) => state.chat
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const socketInitialized = useRef(false);
  const unreadTotal = React.useMemo(() => {
    const uid = user?.id || (user as any)?._id;
    if (!uid) return 0;
    return conversations.reduce((sum, c) => sum + (c.unreadCount?.[uid] || 0), 0);
  }, [conversations, user]);

  // Reflect unread count in document title
  useEffect(() => {
    const base = 'Messenger';
    if (unreadTotal > 0) {
      document.title = `(${unreadTotal}) ${base}`;
    } else {
      document.title = base;
    }
  }, [unreadTotal]);

  // Reset unread counts when page loads
  useEffect(() => {
    if (user && conversations.length > 0 && chatSocketService.markConversationAsRead) {
      // Mark all conversations as read when visiting the messenger page
      conversations.forEach(conversation => {
        const uid = user?.id || (user as any)?._id;
        if (conversation.unreadCount?.[uid] > 0) {
          try {
            chatSocketService.markConversationAsRead(conversation._id);
          } catch (error) {
            // Silent fail for read operations
          }
        }
      });
    }
  }, [user, conversations]);

  // Live refs to avoid stale closures in socket listeners
  const conversationsRef = useRef(conversations);
  const currentConversationRef = useRef(currentConversation);
  const currentUserIdRef = useRef<string | undefined>(user?.id || (user as any)?._id);

  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { currentConversationRef.current = currentConversation; }, [currentConversation]);
  useEffect(() => { currentUserIdRef.current = user?.id || (user as any)?._id; }, [user]);

  // Initialize socket connection
  useEffect(() => {
    if (!socketInitialized.current && user) {
      chatSocketService.connect();
      socketInitialized.current = true;

      // Set up socket event listeners
      chatSocketService.on("new_message", (message: any) => {
        dispatch(addMessage(message));

        // Ensure typing indicator clears when a message arrives from a user
        try {
          if (message?.conversationId && message?.sender?._id) {
            dispatch(
              setTypingUser({
                conversationId: message.conversationId,
                userId: message.sender._id,
                isTyping: false,
              })
            );
          }
        } catch { }

        const convList = conversationsRef.current || [];
        const activeConv = currentConversationRef.current;
        const uid = currentUserIdRef.current;

        // Safety
        if (!uid) return;

        const conversation = convList.find((c) => c._id === message.conversationId);
        const isMuted = !!conversation?.mutedBy?.[uid];
        const isOwn = message?.sender?._id === uid;
        const isActive = activeConv?._id === message.conversationId;
        const isWindowFocused = typeof document !== "undefined" ? document.hasFocus() : true;

        // If active and focused, immediately mark as read to keep unread count accurate
        if (isActive && isWindowFocused) {
          try { chatSocketService.markConversationAsRead(message.conversationId); } catch { }
        }

        // Only toast if: not own, not muted, and either not viewing this convo or window not focused
        if (!isOwn && !isMuted && (!isActive || !isWindowFocused)) {
          toast(`New message from ${message?.sender?.name || "Someone"}`, {
            icon: '💬',
            duration: 3000,
          });
        }
      });

      chatSocketService.on("message_edited", (data: any) => {
        dispatch(updateMessage(data));
      });

      chatSocketService.on("message_deleted", (data: any) => {
        dispatch(deleteMessage(data));
      });

      chatSocketService.on("message_reaction", (data: any) => {
        dispatch(addMessageReaction(data));
      });

      chatSocketService.on("typing_start", (data: any) => {
        dispatch(
          setTypingUser({
            conversationId: data.conversationId,
            userId: data.userId,
            isTyping: true,
          })
        );
      });

      chatSocketService.on("typing_stop", (data: any) => {
        dispatch(
          setTypingUser({
            conversationId: data.conversationId,
            userId: data.userId,
            isTyping: false,
          })
        );
      });

      chatSocketService.on("user_presence", (data: any) => {
        dispatch(updateUserPresence(data));
      });



      chatSocketService.on("unread_counts_updated", (_data: any) => {
        // For now we re-fetch conversations to sync unread counts accurately
        dispatch(fetchConversations());
      });

      chatSocketService.on("read_error", (_error: any) => {
        // Defer and retry read sync silently to avoid user-facing errors
        setTimeout(() => {
          try {
            const activeConv = currentConversationRef.current;
            if (activeConv?._id) {
              chatSocketService.markConversationAsRead(activeConv._id);
            }
          } catch { }
        }, 1000);
      });

      chatSocketService.on("message_error", (error: any) => {
        toast.error(error.error || "Failed to send message");
      });

      chatSocketService.on("reaction_error", (error: any) => {
        toast.error(error.error || "Failed to add reaction");
      });

      chatSocketService.on("edit_error", (error: any) => {
        toast.error(error.error || "Failed to edit message");
      });

      chatSocketService.on("delete_error", (error: any) => {
        toast.error(error.error || "Failed to delete message");
      });

      // WebRTC signaling listeners handled globally in GlobalCallManager
    }

    return () => {
      if (socketInitialized.current) {
        chatSocketService.disconnect();
        socketInitialized.current = false;
      }
    };
  }, [dispatch, user]);

  // Bridge for forward events if child emits DOM custom events
  useEffect(() => {
    const handler = (e: any) => {
      const { targetConversationId, message } = e?.detail || {};
      if (targetConversationId && message) {
        handleForwardMessage(targetConversationId, message);
      }
    };
    (window as any).__forwardHandlerBound = true;
    window.addEventListener("forward_message", handler as any);
    return () => {
      window.removeEventListener("forward_message", handler as any);
      delete (window as any).__forwardHandlerBound;
    };
  }, [currentConversation]);

  // Forward message to another conversation
  const handleForwardMessage = async (targetConversationId: string, msg: any) => {
    try {
      chatSocketService.sendMessage({
        conversationId: targetConversationId,
        content: msg.messageType === "text" ? (msg.content || "") : "",
        messageType: msg.messageType || (msg.mediaUrl ? "file" : "text"),
        mediaUrl: msg.mediaUrl,
        duration: msg.duration,
      });
      if (!currentConversation || currentConversation._id !== targetConversationId) {
        dispatch(fetchConversations());
      }
      toast.success("Message forwarded");
    } catch (e) {
      toast.error("Failed to forward message");
    }
  };

  // Fetch conversations on component mount
  useEffect(() => {
    if (user) {
      dispatch(fetchConversations());
    }
  }, [dispatch, user]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Handle search
  // const handleSearch = async (query: string) => {
  //   setSearchQuery(query);
  //   if (query.trim().length >= 2) {
  //     // setIsSearching(true);
  //     await dispatch(searchUsers(query));
  //     // setIsSearching(false);
  //   }
  // };

  // Handle conversation selection
  const handleConversationSelect = async (conversationId: string) => {
    try {
      await dispatch(fetchConversation(conversationId));
      await dispatch(fetchMessages({ conversationId }));
      setIsSidebarOpen(false);
    } catch (error) {
      toast.error("Failed to load conversation");
    }
  };

  const handleConversationDelete = (conversationId: string) => {
    setDeleteTargetId(conversationId);
    setIsDeleteOpen(true);
  };

  const confirmDeleteConversation = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await (await import("../service/chatService")).ChatService.deleteConversation(deleteTargetId);
      await dispatch(fetchConversations());
      if (currentConversation?._id === deleteTargetId) {
        dispatch(setCurrentConversation(null));
      }
      toast.success("Conversation deleted");
    } catch (e) {
      toast.error("Failed to delete conversation");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    }
  };

  const cancelDeleteConversation = () => {
    if (isDeleting) return;
    setIsDeleteOpen(false);
    setDeleteTargetId(null);
  };

  // Handle new conversation
  const handleNewConversation = async (type: "direct" | "group", name?: string) => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      const participantIds = selectedUsers.map((user) => user._id);
      await dispatch(
        createConversation({
          participants: participantIds,
          type,
          name,
        })
      );

      setShowNewConversationModal(false);
      dispatch(clearSelectedUsers());
      toast.success("Conversation created successfully");
    } catch (error) {
      toast.error("Failed to create conversation");
    }
  };

  // Handle send message
  const handleSendMessage = (content: string, messageType: string = "text", mediaUrl?: string, durationSeconds?: number, replyToId?: string) => {
    if (!currentConversation) return;

    try {
      chatSocketService.sendMessage({
        conversationId: currentConversation._id,
        content,
        messageType,
        mediaUrl,
        duration: durationSeconds,
        replyTo: replyToId,
      });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  // Handle typing
  const handleTyping = (isTyping: boolean) => {
    if (!currentConversation) return;

    if (isTyping) {
      chatSocketService.startTyping(currentConversation._id);
    } else {
      chatSocketService.stopTyping(currentConversation._id);
    }
  };

  // Mark current conversation as read when opened
  useEffect(() => {
    if (currentConversation) {
      try {
        chatSocketService.markConversationAsRead(currentConversation._id);
      } catch { }
    }
  }, [currentConversation]);

  // Handle message reactions
  const handleMessageReaction = (messageId: string, reactionType: string, emoji: string) => {
    try {
      chatSocketService.reactToMessage(messageId, reactionType, emoji);
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  };

  // Handle message edit
  const handleMessageEdit = (messageId: string, content: string) => {
    try {
      chatSocketService.editMessage(messageId, content);
    } catch (error) {
      toast.error("Failed to edit message");
    }
  };

  // Handle message delete
  const handleMessageDelete = (messageId: string) => {
    try {
      chatSocketService.deleteMessage(messageId);
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  // Handle mark as read
  const handleMarkAsRead = (messageId: string) => {
    try {
      chatSocketService.markAsRead(messageId);
    } catch (error) {
      toast.error("Failed to mark message as read");
    }
  };

  // Infinite scroll: load older messages (prior pages)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const hasMoreOlder = React.useMemo(() => {
    if (!currentConversation) return false;
    const convId = currentConversation._id;
    const pag = (pagination as any)?.[convId];
    return !!pag?.hasMore;
  }, [currentConversation, pagination]);

  const loadOlder = async () => {
    if (!currentConversation) return;
    const convId = currentConversation._id;
    const pag = (pagination as any)?.[convId];
    const nextPage = (pag?.currentPage || 1) + 1;
    if (pag && !pag.hasMore) return;
    setIsLoadingOlder(true);
    try {
      await dispatch(fetchMessages({ conversationId: convId, page: nextPage })).unwrap();
    } catch (e) {
      // Silent fail on scroll
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // Handle conversation updates (mute/block/etc)
  const handleConversationUpdate = (updatedConversation: IConversation) => {
    // If this affects the current conversation, update it too
    if (currentConversation && currentConversation._id === updatedConversation._id) {
      dispatch(setCurrentConversation(updatedConversation));
    }

    // Re-fetch conversations to ensure we have the latest data
    dispatch(fetchConversations());
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm max-w-md mx-4">
          <div className="w-20 h-20 mx-auto mb-6 p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
            <User className="w-full h-full text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Welcome to Messenger</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to start chatting with your friends and colleagues.</p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium">
            <Sparkles size={18} />
            Please log in to continue
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="flex h-[47rem] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Conversation List Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-800 border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col backdrop-blur-sm shadow-xl transform transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Messenger</h1>
                  {unreadTotal > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {unreadTotal} unread
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowNewConversationModal(true)}
                className="p-3 text-blue-600 dark:text-blue-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                title="New conversation"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              {searchQuery && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>

          <ConversationList
            conversations={conversations}
            currentConversation={currentConversation}
            onConversationSelect={handleConversationSelect}
            onConversationDelete={handleConversationDelete}
            loading={loading}
            currentUserId={user?.id || user?._id}
            query={searchQuery}
          />
        </div>

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <ChatInterface
              conversation={currentConversation}
              messages={messages[currentConversation._id] || []}
              typingUsers={typingUsers[currentConversation._id] || []}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onMessageReaction={handleMessageReaction}
              onMessageEdit={handleMessageEdit}
              onMessageDelete={handleMessageDelete}
              onMarkAsRead={handleMarkAsRead}
              onConversationUpdate={handleConversationUpdate}
              currentUser={user}
              onToggleSidebar={() => setIsSidebarOpen(true)}
              onLoadOlder={loadOlder}
              hasMoreOlder={hasMoreOlder}
              isLoadingOlder={isLoadingOlder}
              allConversations={conversations}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                {/* Animated Icon */}
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                    <MessageCircle className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white animate-spin" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                  Welcome to your inbox
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  Select a conversation from the sidebar to start messaging, or create a new one to connect with friends and colleagues.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowNewConversationModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus size={18} />
                    Start New Chat
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
                  >
                    <Users size={18} />
                    Browse Chats
                  </button>
                </div>

                {/* Stats or Recent Activity */}
                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle size={14} />
                      <span>{conversations.length} conversations</span>
                    </div>
                    {unreadTotal > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>{unreadTotal} unread</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* New Conversation Modal */}
        {showNewConversationModal && (
          <NewConversationModal
            isOpen={showNewConversationModal}
            onClose={() => setShowNewConversationModal(false)}
            searchResults={searchResults}
            selectedUsers={selectedUsers}
            onUserSelect={(user: IUser) => dispatch(addSelectedUser(user))}
            onUserRemove={(userId: string) => dispatch(removeSelectedUser(userId))}
            onCreateConversation={handleNewConversation}
            loading={loading}
          />
        )}

        {/* Incoming call handled globally via GlobalCallManager */}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteDialog
        header="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        visible={isDeleteOpen}
        onHide={cancelDeleteConversation}
        onConfirm={confirmDeleteConversation}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
      />
    </AdminLayout>
  );
};

export default MessengerPage;