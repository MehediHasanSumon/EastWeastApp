import React, { useState } from "react";
import { ThumbsUp, Heart, Laugh,  Frown, Angry, Smile, Edit3, Trash2, Share2 } from "lucide-react";
import type { IMessage } from "../../service/chatService";

interface MessageBubbleProps {
  message: IMessage;
  isOwnMessage: boolean;
  onReaction: (messageId: string, reactionType: string, emoji: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  currentUser: any;
  onReply?: (message: IMessage) => void;
  onForward?: (message: IMessage) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage, onReaction, onEdit, onDelete, currentUser, onReply, onForward }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const reactions = [
    { type: "like", emoji: "👍" },
    { type: "love", emoji: "❤️" },
    { type: "laugh", emoji: "😂" },
    { type: "wow", emoji: "😮" },
    { type: "sad", emoji: "😢" },
    { type: "angry", emoji: "😠" },
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getDisplayName = () => message.fileName || message.content || "file";

  const buildDownloadUrl = (url?: string, filename?: string) => {
    if (!url) return undefined;
    // If Cloudinary URL, add fl_attachment to force download
    try {
      const u = new URL(url);
      // cloudinary pattern contains "/upload/" segment
      if (u.pathname.includes("/upload/")) {
        u.pathname = u.pathname.replace("/upload/", "/upload/fl_attachment/");
        return u.toString();
      }
    } catch (_) {}
    return url;
  };

  const handleReaction = (reactionType: string, emoji: string) => {
    onReaction(message._id, reactionType, emoji);
    setShowReactions(false);
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message._id, editContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      onDelete(message._id);
    }
  };
  const handleReply = () => {
    if (onReply) onReply(message);
  };

  const isImageUrl = (url?: string) => {
    if (!url) return false;
    try {
      const u = new URL(url);
      const pathname = u.pathname.toLowerCase();
      return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"].some((ext) => pathname.endsWith(ext));
    } catch (_) {
      // Fallback simple check
      const s = url.toLowerCase();
      return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"].some((ext) => s.endsWith(ext));
    }
  };

  const getMessageContent = () => {
    if (message.isDeleted) {
      return <div className="text-gray-400 dark:text-gray-500 italic">This message was deleted</div>;
    }

    switch (message.messageType) {
      case "image":
        return (
          <div>
            <img
              src={message.mediaUrl}
              alt="Shared image"
              className="max-w-xs rounded-xl cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg"
              onClick={() => window.open(message.mediaUrl, "_blank")}
            />
            <div className="mt-3 flex items-center space-x-3">
              {message.content && <p className="text-sm text-gray-600 dark:text-gray-300">{message.content}</p>}
              {message.mediaUrl && (
                <a
                  href={buildDownloadUrl(message.mediaUrl, getDisplayName())}
                  download={getDisplayName()}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                >
                  Download
                </a>
              )}
            </div>
          </div>
        );
      case "file":
        // If backend marked as file but URL is an image, render as image for better UX
        if (isImageUrl(message.mediaUrl)) {
          return (
            <div>
              <img
                src={message.mediaUrl}
                alt={getDisplayName()}
                className="max-w-xs rounded-xl cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg"
                onClick={() => window.open(message.mediaUrl!, "_blank")}
              />
              <div className="mt-3 flex items-center space-x-3">
                {message.content && <p className="text-sm text-gray-600 dark:text-gray-300">{message.content}</p>}
                {message.mediaUrl && (
                  <a
                    href={buildDownloadUrl(message.mediaUrl, getDisplayName())}
                    download={getDisplayName()}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm">
            <div className="text-2xl">📎</div>
            <div>
              <a
                href={buildDownloadUrl(message.mediaUrl, getDisplayName())}
                download={getDisplayName()}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
              >
                {getDisplayName()}
              </a>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : "Unknown size"}
              </div>
            </div>
          </div>
        );
      case "voice":
        return (
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎤</div>
            {message.mediaUrl ? (
              <audio src={message.mediaUrl} controls preload="metadata" className="w-64" />
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">Voice message</div>
            )}
            {message.duration ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(message.duration)}s</span>
            ) : null}
            {message.mediaUrl && (
              <a
                href={buildDownloadUrl(message.mediaUrl, getDisplayName())}
                download={getDisplayName()}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
              >
                Download
              </a>
            )}
          </div>
        );
      case "video":
        return (
          <div>
            <video src={message.mediaUrl} controls className="max-w-xs rounded-xl shadow-lg" />
            <div className="mt-3 flex items-center space-x-3">
              {message.content && <p className="text-sm text-gray-600 dark:text-gray-300">{message.content}</p>}
              {message.mediaUrl && (
                <a
                  href={buildDownloadUrl(message.mediaUrl, getDisplayName())}
                  download={getDisplayName()}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                >
                  Download
                </a>
              )}
            </div>
          </div>
        );
      default:
        return <p className="leading-relaxed">{message.content}</p>;
    }
  };

  const getReactionCount = (reactionType: string) => {
    return Object.values(message.reactions).filter((r) => r.type === reactionType).length;
  };

  const getUserReaction = () => {
    const userId = currentUser?.id || currentUser?._id;
    return message.reactions[userId];
  };

  if (isEditing) {
    return (
      <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}>
        <div className="max-w-xs lg:max-w-md w-full">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-4 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-3">
              <button 
                onClick={handleCancelEdit} 
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleEdit} 
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4 group`}>
      <div className="max-w-xs lg:max-w-md">
        {/* Reply to message */}
        {message.replyTo && (
          <div className={`mb-2 ${isOwnMessage ? "text-right" : "text-left"}`}>
            <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 rounded-lg px-3 py-2 inline-flex items-center gap-2 max-w-[260px]">
              <span className="font-semibold truncate">{(message.replyTo as any)?.sender?.name || "User"}</span>
              <span className="truncate">{(message.replyTo as any)?.content?.substring(0, 60) || (message.replyTo as any)?.fileName || (message.replyTo as any)?.messageType || "message"}</span>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div className={`relative ${
          isOwnMessage 
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25" 
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-lg shadow-gray-500/10 dark:shadow-gray-900/20 border border-gray-200/50 dark:border-gray-700/50"
        } rounded-2xl p-4 backdrop-blur-sm transition-all duration-200 hover:shadow-xl`}>
          {/* Sender name for group chats */}
          {!isOwnMessage && message.sender && (
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 tracking-wide">
              {message.sender.name}
            </div>
          )}

          {/* Message content */}
          <div>{getMessageContent()}</div>

          {/* Edited indicator */}
          {message.isEdited && (
            <div className="text-xs opacity-70 mt-2 italic">
              (edited)
            </div>
          )}

          {/* Time */}
          <div className="text-xs opacity-70 mt-2">
            {formatTime(message.createdAt)}
          </div>

          {/* Message status for own messages */}
          {isOwnMessage && (
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1">
              {message.readBy.length > 0 ? (
                <div className="text-xs text-blue-600 dark:text-blue-400">✓✓</div>
              ) : message.deliveredTo.length > 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400">✓✓</div>
              ) : (
                <div className="text-xs text-gray-400 dark:text-gray-500">✓</div>
              )}
            </div>
          )}

          {/* Message actions */}
          <div
            className={`absolute top-2 ${
              isOwnMessage ? "-left-20" : "-right-20"
            } opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-100 scale-90`}
          >
            <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
              {/* Reactions */}
              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                >
                  <Smile size={16} />
                </button>
                {showReactions && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl p-2 z-10 backdrop-blur-sm">
                    <div className="flex space-x-1">
                      {reactions.map((reaction) => {
                        return (
                          <button
                            key={reaction.type}
                            onClick={() => handleReaction(reaction.type, reaction.emoji)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200 transform hover:scale-110"
                          >
                            {reaction.emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit/Delete for own messages */}
              {isOwnMessage && !message.isDeleted && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={handleDelete} 
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
              {/* Reply for all messages */}
              {!message.isDeleted && (
                <button
                  onClick={handleReply}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                  title="Reply"
                >
                  ↩
                </button>
              )}
              {/* Forward for all messages */}
              {!message.isDeleted && (
                <button
                  onClick={() => onForward?.(message)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                  title="Forward"
                >
                  <Share2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reactions display */}
        {Object.keys(message.reactions).length > 0 && (
          <div className={`mt-2 ${isOwnMessage ? "text-right" : "text-left"}`}>
            <div className="flex flex-wrap gap-2">
              {reactions.map((reaction) => {
                const count = getReactionCount(reaction.type);
                if (count === 0) return null;

                const userReaction = getUserReaction();
                const isUserReaction = userReaction?.type === reaction.type;
                return (
                  <button
                    key={reaction.type}
                    onClick={() => handleReaction(reaction.type, reaction.emoji)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-1 ${
                      isUserReaction 
                        ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-sm" 
                        : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    } hover:scale-105 transform`}
                  >
                   {reaction.emoji}
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;