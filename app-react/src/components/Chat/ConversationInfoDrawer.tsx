import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { 
  X, 
  Users, 
  User, 
  Bell, 
  BellOff, 
  UserX, 
  UserCheck, 
  LogOut, 
  Plus, 
  Image, 
  File, 
  Download, 
  Shield, 
  UserMinus,
  Crown,
  Paperclip
} from "lucide-react";
import type { IConversation } from "../../service/chatService";
import { ChatService } from "../../service/chatService";
import MemberPickerModal from "./MemberPickerModal";

interface Props {
  open: boolean;
  onClose: () => void;
  conversation: IConversation;
  currentUserId: string;
  onConversationUpdate?: (conversation: IConversation) => void;
}

const ConversationInfoDrawer: React.FC<Props> = ({ open, onClose, conversation, currentUserId, onConversationUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const other = conversation.type === "direct" ? conversation.participants.find((p) => p._id !== currentUserId) : null;
  const members = conversation.participants;
  const isGroup = conversation.type === "group";
  
  // Check current states
  const isMuted = conversation.mutedBy?.[currentUserId] || false;
  const isBlocked = conversation.blockedBy?.includes(currentUserId) || false;

  const handleMute = async () => {
    setLoading(true);
    try {
      await ChatService.muteConversation(conversation._id, !isMuted);
      
      // Update local conversation state
      const updatedConversation = {
        ...conversation,
        mutedBy: {
          ...conversation.mutedBy,
          [currentUserId]: !isMuted,
        },
      };
      
      if (onConversationUpdate) {
        onConversationUpdate(updatedConversation);
      }
      
      toast.success(isMuted ? "Conversation unmuted" : "Conversation muted");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update mute status");
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    setLoading(true);
    try {
      await ChatService.blockUser(conversation._id, !isBlocked);
      
      // Update local conversation state
      const updatedConversation = {
        ...conversation,
        blockedBy: isBlocked 
          ? conversation.blockedBy?.filter(id => id !== currentUserId) || []
          : [...(conversation.blockedBy || []), currentUserId],
      };
      
      if (onConversationUpdate) {
        onConversationUpdate(updatedConversation);
      }
      
      toast.success(isBlocked ? "User unblocked" : "User blocked");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update block status");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    
    setLoading(true);
    try {
      await ChatService.leaveGroup(conversation._id);
      toast.success("Left group successfully");
      onClose();
      // You might want to redirect or refresh conversations here
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    } finally {
      setLoading(false);
    }
  };

  // Media state
  const [mediaTab, setMediaTab] = useState<"images" | "files">("images");
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaHasMore, setMediaHasMore] = useState(true);

  useEffect(() => {
    if (!open) return;
    // Reset on open
    setMediaItems([]);
    setMediaPage(1);
    setMediaHasMore(true);
    void fetchMedia(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mediaTab, conversation._id]);

  const fetchMedia = async (page: number, replace = false) => {
    try {
      const type = mediaTab === "images" ? "image" : "file";
      const res = await ChatService.getConversationMedia(conversation._id, type, page, 24);
      setMediaItems(replace ? res.data : [...mediaItems, ...res.data]);
      setMediaHasMore(res.pagination.hasMore);
      setMediaPage(page);
    } catch (err) {
      // Silent fail to keep UX clean
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl overflow-y-auto border-l border-slate-700/50">
        {/* Header */}
        <div className="sticky top-0 z-10 backdrop-blur-lg bg-slate-900/80 p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Conversation info</h2>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Section */}
          {isGroup ? (
            <div className="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/30">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-xl text-white">{conversation.name || "Group"}</div>
                <div className="text-slate-400 flex items-center space-x-2">
                  <Users size={14} />
                  <span>{members.length} members</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/30">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <User size={24} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-xl text-white">{other?.name}</div>
                <div className="text-slate-400">{other?.email}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${other?.presence?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                  <span className="text-sm text-slate-400">
                    {other?.presence?.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Actions</h3>
            
            <button 
              onClick={handleMute} 
              disabled={loading}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 ${
                isMuted 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                  : 'bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50'
              }`}
            >
              {isMuted ? <Bell size={18} /> : <BellOff size={18} />}
              <span className="font-medium">{isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
            </button>

            {!isGroup && (
              <button 
                onClick={handleBlock} 
                disabled={loading}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 ${
                  isBlocked 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                {isBlocked ? <UserCheck size={18} /> : <UserX size={18} />}
                <span className="font-medium">{isBlocked ? 'Unblock user' : 'Block user'}</span>
              </button>
            )}

            {isGroup && (
              <button 
                onClick={handleLeaveGroup} 
                disabled={loading}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all duration-200 disabled:opacity-50"
              >
                <LogOut size={18} />
                <span className="font-medium">Leave group</span>
              </button>
            )}
          </div>

          {/* Group Members */}
          {isGroup && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Members</h3>
                <button
                  onClick={() => setShowMemberPicker(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all duration-200"
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {members.map((m) => {
                  const isMemberAdmin = (conversation.admins || []).some((a) =>
                    (a as any)._id ? (a as any)._id === m._id : (a as any).toString?.() === m._id
                  );
                  const isCurrentUserAdmin = (conversation.admins || []).some((a) =>
                    (a as any)._id ? (a as any)._id === currentUserId : (a as any).toString?.() === currentUserId
                  );
                  const canManage = isCurrentUserAdmin && m._id !== currentUserId;

                  return (
                    <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-700/30 transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center space-x-2">
                            <span>{m.name}</span>
                            {isMemberAdmin && (
                              <Crown size={14} className="text-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{m.email}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${m.presence?.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                            <span className="text-xs text-slate-500">{m.presence?.isOnline ? "Online" : "Offline"}</span>
                          </div>
                        </div>
                      </div>
                      
                      {canManage && (
                        <div className="flex items-center space-x-2">
                          {!isMemberAdmin ? (
                            <button
                              disabled={loading}
                              onClick={() => {
                                void (async () => {
                                  setLoading(true);
                                  try {
                                    const updated = await ChatService.updateAdmins(conversation._id, { action: 'add', memberId: m._id });
                                    onConversationUpdate && onConversationUpdate(updated);
                                    toast.success('Made admin');
                                  } catch (e: any) {
                                    toast.error(e?.response?.data?.message || 'Failed to make admin');
                                  } finally { setLoading(false); }
                                })();
                              }}
                              className="flex items-center space-x-1 px-2 py-1 text-xs rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all duration-200"
                            >
                              <Shield size={12} />
                              <span>Admin</span>
                            </button>
                          ) : (
                            <button
                              disabled={loading}
                              onClick={() => {
                                void (async () => {
                                  setLoading(true);
                                  try {
                                    const updated = await ChatService.updateAdmins(conversation._id, { action: 'remove', memberId: m._id });
                                    onConversationUpdate && onConversationUpdate(updated);
                                    toast.success('Removed admin');
                                  } catch (e: any) {
                                    toast.error(e?.response?.data?.message || 'Failed to remove admin');
                                  } finally { setLoading(false); }
                                })();
                              }}
                              className="flex items-center space-x-1 px-2 py-1 text-xs rounded-lg bg-slate-600/50 text-slate-300 border border-slate-600/50 hover:bg-slate-500/50 transition-all duration-200"
                            >
                              <Crown size={12} />
                            </button>
                          )}
                          <button
                            disabled={loading}
                            onClick={() => {
                              if (!window.confirm(`Remove ${m.name} from group?`)) return;
                              void (async () => {
                                setLoading(true);
                                try {
                                  const updated = await ChatService.manageParticipants(conversation._id, { action: 'remove', participantIds: [m._id] });
                                  onConversationUpdate && onConversationUpdate(updated);
                                  toast.success('Member removed');
                                } catch (e: any) {
                                  toast.error(e?.response?.data?.message || 'Failed to remove member');
                                } finally { setLoading(false); }
                              })();
                            }}
                            className="flex items-center space-x-1 px-2 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all duration-200"
                          >
                            <UserMinus size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Media Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Media</h3>
              <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/30">
                <button
                  onClick={() => setMediaTab("images")}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                    mediaTab === "images" 
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Image size={14} />
                  <span>Photos</span>
                </button>
                <button
                  onClick={() => setMediaTab("files")}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                    mediaTab === "files" 
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <File size={14} />
                  <span>Files</span>
                </button>
              </div>
            </div>

            {mediaItems.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <div className="w-16 h-16 mx-auto mb-3 opacity-50">
                  {mediaTab === "images" ? <Image size={64} /> : <File size={64} />}
                </div>
                <p>No {mediaTab === "images" ? "photos" : "files"} found</p>
              </div>
            ) : mediaTab === "images" ? (
              <div className="grid grid-cols-3 gap-2">
                {mediaItems.map((item) => (
                  <a 
                    key={`${item.mediaUrl}-${item.createdAt}`} 
                    href={item.mediaUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="relative group overflow-hidden rounded-lg"
                  >
                    <img 
                      src={item.mediaUrl} 
                      alt={item.fileName || "image"} 
                      className="w-full h-24 object-cover transition-transform duration-200 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"></div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {mediaItems.map((item) => (
                  <div key={`${item.mediaUrl}-${item.createdAt}`} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-700/30 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-700/50 rounded-lg">
                        <Paperclip size={16} className="text-slate-400" />
                      </div>
                      <div>
                        <a 
                          href={item.mediaUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors duration-200"
                        >
                          {item.fileName || "file"}
                        </a>
                        <div className="text-xs text-slate-500">
                          {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : "Unknown size"}
                        </div>
                      </div>
                    </div>
                    <a 
                      href={item.mediaUrl} 
                      download 
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {mediaHasMore && (
              <div className="mt-4">
                <button 
                  onClick={() => fetchMedia(mediaPage + 1)} 
                  className="w-full px-4 py-2 text-sm rounded-lg bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-200"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {isGroup && (
        <MemberPickerModal
          isOpen={showMemberPicker}
          onClose={() => setShowMemberPicker(false)}
          existingMemberIds={members.map(m => m._id)}
          onAdd={async (ids) => {
            setLoading(true);
            try {
              const updated = await ChatService.manageParticipants(conversation._id, { action: 'add', participantIds: ids });
              onConversationUpdate && onConversationUpdate(updated);
              toast.success("Members added");
              setShowMemberPicker(false);
            } catch (e: any) {
              toast.error(e?.response?.data?.message || "Failed to add members");
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default ConversationInfoDrawer;