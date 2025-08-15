import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchUsers } from "../../app/features/chat/chatSlice";
import type { AppDispatch, RootState } from "../../app/Store";
import type { IUser } from "../../service/chatService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingMemberIds: string[];
  onAdd: (userIds: string[]) => void | Promise<void>;
}

const MemberPickerModal: React.FC<Props> = ({ isOpen, onClose, existingMemberIds, onAdd }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { searchResults, loading } = useSelector((state: RootState) => state.chat);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<IUser[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelected([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 2) {
        dispatch(searchUsers(query.trim()));
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, dispatch]);

  if (!isOpen) return null;

  const toggleSelect = (user: IUser) => {
    if (existingMemberIds.includes(user._id)) return; // prevent selecting existing members
    setSelected((prev) =>
      prev.find((u) => u._id === user._id) ? prev.filter((u) => u._id !== user._id) : [...prev, user]
    );
  };

  const handleAdd = async () => {
    if (selected.length === 0) return;
    await onAdd(selected.map((u) => u._id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-700/50 backdrop-blur-xl overflow-hidden">
        
        {/* Header */}
        <div className="relative p-6 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-t-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Add Members</h3>
              <p className="text-slate-400 text-sm">Search and select users to add to the conversation</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 flex items-center justify-center group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-slate-700/30">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* User List */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400">Searching users...</span>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {searchResults.map((user) => {
                const isExisting = existingMemberIds.includes(user._id);
                const isSelected = selected.find((u) => u._id === user._id);
                return (
                  <div
                    key={user._id}
                    className={`flex items-center justify-between p-4 transition-all duration-200 ${
                      isExisting 
                        ? "opacity-50 cursor-not-allowed" 
                        : "hover:bg-slate-800/40 cursor-pointer"
                    }`}
                    onClick={() => !isExisting && toggleSelect(user)}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg transition-all duration-200 ${
                        isSelected 
                          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white" 
                          : isExisting
                          ? "bg-slate-700 text-slate-400"
                          : "bg-gradient-to-br from-slate-600 to-slate-500 text-slate-200 group-hover:from-slate-500 group-hover:to-slate-400"
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <div className={`font-semibold transition-colors duration-200 ${
                          isSelected ? "text-white" : "text-slate-200"
                        }`}>
                          {user.name}
                        </div>
                        <div className="text-sm text-slate-400">{user.email}</div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="text-sm font-medium">
                      {isExisting ? (
                        <span className="px-3 py-1 bg-slate-700/50 text-slate-400 rounded-full border border-slate-600/50">
                          Member
                        </span>
                      ) : isSelected ? (
                        <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-full border border-green-500/30">
                          Selected
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-800/50 text-slate-400 rounded-full border border-slate-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Add
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {searchResults.length === 0 && !loading && (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 text-slate-500 bg-slate-800/50 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-lg font-medium">No users found</p>
                  <p className="text-slate-500 text-sm mt-1">Try searching with different keywords</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-slate-700/30 bg-slate-900/50">
          <div className="flex items-center justify-end space-x-3">
            <button 
              onClick={onClose} 
              className="px-6 py-3 rounded-2xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border border-slate-600/50 font-medium transition-all duration-200 hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selected.length === 0}
              className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${
                selected.length === 0
                  ? "bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/30"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 hover:scale-105"
              }`}
            >
              Add {selected.length > 0 ? `(${selected.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberPickerModal;