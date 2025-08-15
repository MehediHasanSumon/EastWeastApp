import React from "react";
import { getProfileImage } from "../../utils/utils";

export interface ProfilePicture {
  image: string;
  publicId: string;
}

export interface User {
  _id: string;
  name: string;
  profile_picture: ProfilePicture | null;
  bio: string | null;
  profession: string | null;
}

type ProfileCardProps = {
  user: User;
};

const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  return (
    <div className="mt-12 p-6 bg-gray-50 rounded-xl dark:bg-gray-800">
      <div className="flex items-center">
        <img src={getProfileImage(user)} alt={user.name} className="w-16 h-16 rounded-full mr-4" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{user.profession ?? "No profession specified"}</p>

          {user.bio && <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">{user.bio}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
