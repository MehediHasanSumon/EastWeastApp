import { AxiosError } from "axios";
import { useEffect } from "react";
import { useUser } from "../context/UserContext";
import request from "../service/AxiosInstance";

const ProfileInfo = () => {
  const { user, isEditing, handleInputChange } = useUser();

  useEffect(() => {
    try {
      const fetchProfileData = async () => {
        const response = await request.get("/api/me");
        console.log(response.data);
      };
      fetchProfileData();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log("Error in ProfilePage useEffect:", error);
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Personal Information</h3>
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={user.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation</label>
            <input
              type="text"
              name="designation"
              value={user.designation}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">Name:</span> {user.name}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">Designation:</span> {user.designation}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo;
