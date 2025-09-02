import React, { useMemo, useState } from "react";
import Dialog from "../ui/Dialog";
import { Search, User, Users, Forward } from "lucide-react";
import type { IConversation, IMessage } from "../../service/chatService";

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: IMessage | null;
  conversations: IConversation[];
  currentConversationId?: string;
  currentUserId?: string;
  onForward: (targetConversationId: string, message: IMessage) => Promise<void> | void;
}

const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({ isOpen, onClose, message, conversations, currentConversationId, currentUserId, onForward }) => {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    const list = conversations.filter((c) => c._id !== currentConversationId);
    
    if (!q) return list;
    return list.filter((c) => {
      const name = getConversationName(c, currentUserId).toLowerCase();
      const participantNames = c.participants.map((p) => p.name.toLowerCase()).join(" ");
      return name.includes(q) || participantNames.includes(q);
    });
  }, [conversations, currentConversationId, query]);

  const getConversationName = (c: IConversation, uid?: string) => {
    if (c.type === "group") return c.name || "Group";
    const me = (uid || "").toString();
    const other = c.participants.find((p: any) => (p._id || p).toString() !== me);
    return other?.name || "Direct";
  };

  const handleForward = async () => {
    if (!selectedId || !message) return;
    await onForward(selectedId, message);
    setSelectedId(null);
    setQuery("");
    onClose();
  };

  return (
    <Dialog header="Forward message" visible={isOpen} onHide={onClose} className="w-full max-w-xl">
      {!message ? (
        <div className="text-sm text-gray-500">No message selected</div>
      ) : (
        <div className="space-y-4">
          {/* Enhanced Message Preview */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2 text-xs font-medium">
              <Forward size={14} />
              Forward Message
            </div>
            
            {/* Sender Info */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                {message.sender.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {message.sender.name}
              </span>
            </div>
            
            {/* Message Content */}
            <div className="text-sm text-gray-800 dark:text-gray-200 break-words">
              {message.isDeleted ? (
                <span className="text-gray-500 dark:text-gray-400 italic">
                  This message was deleted
                </span>
              ) : message.content ? (
                message.content
              ) : message.fileName ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">📎</span>
                  <span>{message.fileName}</span>
                  {message.fileSize && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({Math.round(message.fileSize / 1024)}KB)
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  {message.messageType} message
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filtered.map((c) => {
              const name = getConversationName(c, currentUserId);
              const checked = selectedId === c._id;
              return (
                <label key={c._id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all duration-200 ${
                  checked 
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                }`}>
                  <input 
                    type="radio" 
                    name="forward-target" 
                    checked={checked} 
                    onChange={() => setSelectedId(c._id)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-2">
                    {c.type === "group" ? (
                      <Users size={16} className="text-gray-500 dark:text-gray-400" />
                    ) : (
                      <User size={16} className="text-gray-500 dark:text-gray-400" />
                    )}
                    <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{name}</span>
                    {c.type === "group" && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {c.participants.length} members
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500">No conversations found</div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Cancel</button>
            <button disabled={!selectedId} onClick={handleForward} className="px-3 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60">Forward</button>
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default ForwardMessageModal;


