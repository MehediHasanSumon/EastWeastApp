import { useEffect, useRef, useState } from "react";
import { FiMessageSquare, FiMinimize, FiSend, FiX } from "react-icons/fi";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  time: Date;
}

const LiveChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! How can I help you today?",
      sender: "bot",
      time: new Date(Date.now() - 60000),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Profile pictures
  const userProfilePic = "https://randomuser.me/api/portraits/men/32.jpg";
  const botProfilePic = "https://randomuser.me/api/portraits/women/44.jpg";

  useEffect(() => {
    if (isOpen && chatWindowRef.current) {
      // Position the chat window slightly above the button
      const buttonSize = 56; // 14 * 4 (w-14 in Tailwind)
      setPosition({
        x: window.innerWidth - 320 - 24, // 320 is chat width, 24 is margin
        y: window.innerHeight - 500 - buttonSize - 24, // 500 is chat height
      });
    }
  }, [isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === "") return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      time: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Simulate bot response after 1 second
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: "Thanks for your message! I'll get back to you shortly.",
        sender: "bot",
        time: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 transform hover:scale-110"
          aria-label="Open chat"
        >
          <FiMessageSquare className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className={`fixed bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 ${
            isMinimized ? "w-80 h-16" : "w-80 h-[500px]"
          }`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: isDragging ? "grabbing" : "default",
          }}
        >
          {/* Chat Header - Draggable area */}
          <div
            className="bg-blue-600 dark:bg-blue-700 text-white p-4 flex justify-between items-center cursor-move"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center space-x-3">
              <img src={botProfilePic} alt="Support Agent" className="w-8 h-8 rounded-full object-cover" />
              <div>
                <h3 className="font-semibold">Sarah Johnson</h3>
                <p className="text-xs opacity-80">Support Agent</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded-full hover:bg-blue-500 transition-colors"
                aria-label={isMinimized ? "Restore chat" : "Minimize chat"}
              >
                <FiMinimize className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="p-1 rounded-full hover:bg-blue-500 transition-colors"
                aria-label="Close chat"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat Messages */}
              <div className="h-[calc(100%-120px)] overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} gap-2`}
                  >
                    {message.sender === "bot" && (
                      <img
                        src={botProfilePic}
                        alt="Support Agent"
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    <div className="max-w-[calc(100%-60px)]">
                      <div className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} mb-1`}>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {message.sender === "user" ? "You" : "Sarah"} • {formatTime(message.time)}
                        </span>
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender === "user"
                            ? "bg-blue-100 dark:bg-blue-900/50 rounded-br-none"
                            : "bg-gray-100 dark:bg-gray-700 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                    {message.sender === "user" && (
                      <img src={userProfilePic} alt="You" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={inputValue.trim() === ""}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiSend className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Minimized State */}
          {isMinimized && (
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={botProfilePic} alt="Support Agent" className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-medium">Sarah Johnson</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active now</p>
                </div>
              </div>
              <button
                onClick={() => setIsMinimized(false)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Restore
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveChat;
