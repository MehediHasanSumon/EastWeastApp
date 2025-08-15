import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { FaCamera, FaRegUserCircle } from "react-icons/fa";
import AdminLayout from "../../../layouts/Admin/AdminLayout";
import AdminSettingLayout from "../../../layouts/Admin/AdminSettingLayout";

const ProfileInformation = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const breadcrumbItems = [{ label: "Dashboard", path: "/dashboard" }, { label: "Settings" }];
  return (
    <AdminLayout breadcrumbItems={breadcrumbItems}>
      <AdminSettingLayout>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center space-x-3">
            <FaRegUserCircle className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Profile Information</h2>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <form className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profession</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Software Developer"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                      <div
                        className="relative w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center cursor-pointer overflow-hidden group"
                        onClick={triggerFileInput}
                      >
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <FaRegUserCircle className="w-20 h-20 text-gray-400" />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaCamera className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">JPG or PNG. Max size 2MB</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                      placeholder="123 Main St, City, Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Tell us about yourself..."
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Brief description for your profile.</p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </AdminSettingLayout>
    </AdminLayout>
  );
};

export default ProfileInformation;
