import React, { useMemo, useState } from "react";
import Dialog from "../ui/Dialog";
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
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 text-sm">
            <div className="text-gray-500 dark:text-gray-400 mb-1">Preview</div>
            <div className="text-gray-800 dark:text-gray-200 break-words">
              {message.content || message.fileName || message.messageType}
            </div>
          </div>

          <div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filtered.map((c) => {
              const name = getConversationName(c, currentUserId);
              const checked = selectedId === c._id;
              return (
                <label key={c._id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border ${checked ? "border-emerald-500" : "border-gray-200 dark:border-gray-700"} hover:bg-gray-50 dark:hover:bg-gray-700/40`}>
                  <input type="radio" name="forward-target" checked={checked} onChange={() => setSelectedId(c._id)} />
                  <span className="text-sm text-gray-800 dark:text-gray-200">{name}</span>
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


