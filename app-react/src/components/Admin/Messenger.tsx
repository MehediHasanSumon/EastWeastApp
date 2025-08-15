import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FiMic, FiMoreVertical, FiPaperclip, FiPhone, FiSearch, FiSend, FiSmile, FiVideo } from "react-icons/fi";
import { IoCheckmarkDone } from "react-icons/io5";
import { useParams } from "react-router";

interface Message {
  id: string;
  sender: "me" | "them";
  content: string;
  timestamp: Date;
  read: boolean;
  type: "text" | "image" | "file";
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  online: boolean;
  status?: "typing" | "online" | "offline";
}

const Messenger = () => {
  const { conversationId } = useParams();
  const [activeConversation, setActiveConversation] = useState<string | null>(conversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample data initialization
  useEffect(() => {
    const sampleConversations: Conversation[] = [
      {
        id: "1",
        name: "Alex Johnson",
        avatar: "https://i.pravatar.cc/150?img=11",
        lastMessage: "Hey, how's the project coming along?",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
        unreadCount: 2,
        online: true,
      },
      {
        id: "2",
        name: "Sarah Williams",
        avatar: "https://i.pravatar.cc/150?img=5",
        lastMessage: "Let's meet tomorrow at 2pm",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
        unreadCount: 0,
        online: false,
      },
      {
        id: "3",
        name: "Development Team",
        avatar: "https://i.pravatar.cc/150?img=60",
        lastMessage: "Michael: I've pushed the latest changes",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
        unreadCount: 5,
        online: true,
      },
      {
        id: "4",
        name: "Marketing Dept",
        avatar: "https://i.pravatar.cc/150?img=45",
        lastMessage: "New campaign draft attached",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
        unreadCount: 0,
        online: false,
      },
      {
        id: "5",
        name: "David Miller",
        avatar: "https://i.pravatar.cc/150?img=32",
        lastMessage: "Thanks for the feedback!",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 48),
        unreadCount: 0,
        online: true,
        status: "typing",
      },
      {
        id: "6",
        name: "Emily Chen",
        avatar: "https://i.pravatar.cc/150?img=3",
        lastMessage: "The designs are ready for review",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 3),
        unreadCount: 1,
        online: true,
      },
      {
        id: "7",
        name: "Robert Taylor",
        avatar: "https://i.pravatar.cc/150?img=8",
        lastMessage: "Can we reschedule our meeting?",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 12),
        unreadCount: 0,
        online: false,
      },
    ];

    setConversations(sampleConversations);

    if (!activeConversation && sampleConversations.length > 0) {
      setActiveConversation(sampleConversations[0].id);
    }
  }, []);

  // Load messages for active conversation
  useEffect(() => {
    if (activeConversation) {
      const sampleMessages: Message[] = [
        {
          id: "1",
          sender: "them",
          content: "Hey there! How's it going?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          read: true,
          type: "text",
        },
        {
          id: "2",
          sender: "me",
          content: "Pretty good! Just working on that project we discussed.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          read: true,
          type: "text",
        },
        {
          id: "3",
          sender: "them",
          content: "That's great! I've attached the design files you requested.",
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          read: true,
          type: "text",
        },
        {
          id: "4",
          sender: "them",
          content: "https://example.com/design-files.zip",
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          read: true,
          type: "file",
        },
        {
          id: "5",
          sender: "me",
          content: "Thanks! I'll take a look at these today.",
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          read: true,
          type: "text",
        },
        {
          id: "6",
          sender: "them",
          content: "No rush. Let me know if you have any questions.",
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          read: false,
          type: "text",
        },
      ];
      setMessages(sampleMessages);
    }
  }, [activeConversation]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const message: Message = {
      id: Date.now().toString(),
      sender: "me",
      content: newMessage,
      timestamp: new Date(),
      read: false,
      type: "text",
    };

    setMessages([...messages, message]);
    setNewMessage("");

    // Simulate reply after 1-3 seconds
    if (Math.random() > 0.3) {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          sender: "them",
          content: getRandomReply(),
          timestamp: new Date(),
          read: false,
          type: "text",
        };
        setMessages((prev) => [...prev, reply]);
      }, delay);
    }
  };

  const getRandomReply = () => {
    const replies = [
      "Sounds good!",
      "I'll get back to you on that.",
      "Thanks for letting me know.",
      "Can we discuss this tomorrow?",
      "I appreciate your message!",
      "Let me check and get back to you.",
      "That's interesting, tell me more.",
      "Perfect timing!",
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv) => conv.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const currentConversation = conversations.find((conv) => conv.id === activeConversation);

  return (
    <div className="flex h-[12]">
      {/* Conversations sidebar */}
      <div className="w-full md:w-80 border-r dark:border-gray-700/50 border-gray-200/50 flex flex-col bg-white dark:bg-gray-800">
        {/* Sidebar header */}
        <div className="p-4 border-b dark:border-gray-700/50 border-gray-200/50 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Messages</h2>
        </div>

        {/* Search bar */}
        <div className="p-4 border-b dark:border-gray-700/50 border-gray-200/50 bg-gray-50 dark:bg-gray-700/30">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border dark:border-gray-600 dark:bg-gray-700 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`flex items-center p-4 border-b dark:border-gray-700/30 border-gray-200/30 cursor-pointer transition-colors duration-200
                ${
                  activeConversation === conversation.id
                    ? "bg-indigo-50/80 dark:bg-gray-700"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              onClick={() => setActiveConversation(conversation.id)}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={conversation.avatar}
                  alt={conversation.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                />
                {conversation.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-700"></div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{conversation.name}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                    {format(conversation.lastMessageTime, "h:mm a")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{conversation.lastMessage}</p>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-indigo-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                {conversation.status === "typing" && (
                  <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-1 flex items-center">
                    <span className="inline-block h-2 w-2 bg-indigo-500 dark:bg-indigo-400 rounded-full mr-1 animate-pulse"></span>
                    typing...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Conversation header */}
            <div className="p-4 border-b dark:border-gray-700/50 border-gray-200/50 flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex items-center">
                <img src={currentConversation.avatar} alt={currentConversation.name} className="w-10 h-10 rounded-full" />
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">{currentConversation.name}</h3>
                  <div className="flex items-center">
                    {currentConversation.online ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {currentConversation.status === "typing" ? "typing..." : "online"}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        last seen {format(currentConversation.lastMessageTime, "MMM d")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FiPhone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FiVideo className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FiSearch className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FiMoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
              <div className="space-y-4">
                {messages.map((message) => (
                  <AnimatePresence key={message.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                          message.sender === "me"
                            ? "bg-indigo-500 text-white rounded-br-none"
                            : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none"
                        } shadow-sm`}
                      >
                        {message.type === "text" ? (
                          <p>{message.content}</p>
                        ) : message.type === "file" ? (
                          <div className="flex items-center p-2 bg-indigo-100 dark:bg-gray-600 rounded">
                            <FiPaperclip className="mr-2" />
                            <a href={message.content} className="underline truncate">
                              {message.content.split("/").pop()}
                            </a>
                          </div>
                        ) : null}
                        <div
                          className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                            message.sender === "me" ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          <span>{format(message.timestamp, "h:mm a")}</span>
                          {message.sender === "me" && (
                            <IoCheckmarkDone className={message.read ? "text-blue-300" : "text-gray-300 dark:text-gray-500"} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message input */}
            <div className="p-4 border-t dark:border-gray-700/50 border-gray-200/50 bg-white dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex items-center">
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FiPaperclip className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-1">
                  <FiSmile className="w-5 h-5" />
                </button>
                <div className="flex-1 mx-2">
                  <textarea
                    className="block w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-500 dark:focus:border-indigo-500 resize-none"
                    placeholder="Type a message..."
                    rows={1}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                {newMessage.trim() ? (
                  <button
                    className="p-2 text-white bg-indigo-500 rounded-full hover:bg-indigo-600 transition-colors"
                    onClick={handleSendMessage}
                  >
                    <FiSend className="w-5 h-5" />
                  </button>
                ) : (
                  <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <FiMic className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
            <div className="text-center p-6 max-w-md">
              <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-indigo-500 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No conversation selected</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Select a conversation from the sidebar or start a new one to begin messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;
