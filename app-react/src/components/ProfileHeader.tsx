import { motion } from "framer-motion";
import { useUser } from "../context/UserContext";

const ProfileHeader: React.FC = () => {
  const { user, isEditing, setIsEditing, handleSaveProfile } = useUser();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row items-center md:items-end justify-between bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
    >
      <div className="flex items-center space-x-4 mb-4 md:mb-0">
        <motion.div whileHover={{ scale: 1.05 }} className="relative">
          <img
            src={user.profilePicture}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-900"
          />
          {isEditing && (
            <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold dark:text-white">{user.name}</h2>
          <p className="text-gray-600 dark:text-gray-300">{user.designation}</p>
        </div>
      </div>
      <motion.button
        onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`px-4 py-2 rounded-lg ${
          isEditing ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"
        } text-white transition-colors`}
      >
        {isEditing ? "Save Profile" : "Edit Profile"}
      </motion.button>
    </motion.div>
  );
};

export default ProfileHeader;
