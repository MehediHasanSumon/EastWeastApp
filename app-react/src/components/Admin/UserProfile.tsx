import React from "react";
import { getProfileImageUrl, handleProfileImageError } from "../../utils/profileImage";

interface Role {
  name: string;
}

interface User {
  name?: string;
  roles?: Role[];
  profile_picture?: string;
}

interface UserProfileProps {
  user?: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="px-4 py-3 border-t dark:border-gray-700/50 border-gray-200/50">
      <div className="flex items-center">
        <img 
          src={getProfileImageUrl(user?.profile_picture, user?.name)} 
          alt="User" 
          className="w-9 h-9 rounded-full border-2 border-indigo-400 object-cover" 
          onError={handleProfileImageError}
        />
        <div className="ml-3">
          <p className="text-sm font-medium dark:text-white text-gray-900">{user?.name || "User"}</p>
          <p className="text-xs dark:text-gray-400 text-gray-500">{user?.roles?.[0]?.name || "Role"}</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
