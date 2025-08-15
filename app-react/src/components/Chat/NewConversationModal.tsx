import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Search, User, Users, MessageCircle, Plus, Loader2, Check } from "lucide-react";
import type { IUser } from "../../service/chatService";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../app/Store";
import { searchUsers as searchUsersThunk } from "../../app/features/chat/chatSlice";

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: IUser[];
  selectedUsers: IUser[];
  onUserSelect: (user: IUser) => void;
  onUserRemove: (userId: string) => void;
  onCreateConversation: (type: "direct" | "group", name?: string) => void;
  loading: boolean;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  searchResults,
  selectedUsers,
  onUserSelect,
  onUserRemove,
  onCreateConversation,
  loading,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationType, setConversationType] = useState<"direct" | "group">("direct");
  const [groupName, setGroupName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setConversationType("direct");
      setGroupName("");
      setValidationError(null);
    }
  }, [isOpen]);

  // Debounced search that updates global search results
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) return;
    debounceRef.current = window.setTimeout(() => {
      dispatch(searchUsersThunk(searchQuery.trim()));
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [dispatch, searchQuery]);

  const handleCreateConversation = () => {
    setValidationError(null);
    if (conversationType === "direct") {
      if (selectedUsers.length !== 1) {
        setValidationError("Select exactly one user for a direct message");
        return;
      }
    }
    if (conversationType === "group") {
      if (selectedUsers.length < 2) {
        setValidationError("Select at least two users for a group chat");
        return;
      }
      if (!groupName.trim()) {
        setValidationError("Please enter a group name");
        return;
      }
    }
    onCreateConversation(conversationType, conversationType === "group" ? groupName.trim() : undefined);
  };

  const handleSelectUser = (user: IUser) => {
    // Prevent duplicates
    if (selectedUsers.some((u) => u._id === user._id)) return;
    // Auto-switch to group if trying to select multiple in direct
    if (conversationType === "direct" && selectedUsers.length >= 1) {
      setConversationType("group");
    }
    onUserSelect(user);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">New Conversation</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Conversation Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Conversation Type
            </label>
            <div className="flex space-x-3">
              <label className="flex-1">
                <input
                  type="radio"
                  value="direct"
                  checked={conversationType === "direct"}
                  onChange={(e) => setConversationType(e.target.value as "direct" | "group")}
                  className="sr-only"
                />
                <div className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  conversationType === "direct" 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
                }`}>
                  <User size={20} />
                  <span className="font-medium">Direct</span>
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  value="group"
                  checked={conversationType === "group"}
                  onChange={(e) => setConversationType(e.target.value as "direct" | "group")}
                  className="sr-only"
                />
                <div className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  conversationType === "group" 
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" 
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
                }`}>
                  <Users size={20} />
                  <span className="font-medium">Group</span>
                </div>
              </label>
            </div>
          </div>

          {/* Group Name Input */}
          {conversationType === "group" && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Group Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          )}

          {/* User Search */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Search Users
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.trim().length >= 2 && (
            <div className="space-y-2">
              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                {loading ? (
                  <div className="flex items-center justify-center p-6 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Searching users...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </div>
                ) : (
                  searchResults.map((user) => {
                    const isSelected = selectedUsers.some((u) => u._id === user._id);
                    return (
                      <div
                        key={user._id}
                        onClick={() => handleSelectUser(user)}
                        className={`flex items-center space-x-3 p-4 hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 ${
                          isSelected ? "bg-blue-50 dark:bg-blue-900/30" : ""
                        } first:rounded-t-xl last:rounded-b-xl`}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Selected Users ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div 
                    key={user._id} 
                    className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-700/50 backdrop-blur-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate max-w-[120px]">{user.name}</span>
                    <button 
                      onClick={() => onUserRemove(user._id)} 
                      className="text-blue-600 dark:text-blue-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full p-1 transition-all duration-200 transform hover:scale-110"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">{validationError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/20">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0 || loading}
            className="px-6 py-2.5 text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-medium disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;