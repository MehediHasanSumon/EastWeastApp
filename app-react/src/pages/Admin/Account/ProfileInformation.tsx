import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { FaCamera, FaRegUserCircle } from "react-icons/fa";
import AdminLayout from "../../../layouts/Admin/AdminLayout";
import AdminSettingLayout from "../../../layouts/Admin/AdminSettingLayout";
import Input from "../../../components/ui/Input";
import Label from "../../../components/ui/Label";
import Textarea from "../../../components/ui/Textarea";
import request from "../../../service/AxiosInstance";

const ProfileInformation = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    profession: "",
    date_of_birth: "",
    phone: "",
    address: "",
    bio: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const payload: any = {
        name: formData.name.trim(),
        profession: formData.profession.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        bio: formData.bio.trim(),
      };
      
      // Add date_of_birth if it exists
      if (formData.date_of_birth) {
        payload.date_of_birth = new Date(formData.date_of_birth).toISOString();
      }
      
      const response = await request.put('/api/me', payload);
      
      if (response.data.status) {
        // Handle success - you can add toast notification here
        console.log('Profile updated successfully:', response.data.user);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      // Handle error - you can add error toast notification here
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      console.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          type="text" 
                          placeholder="Sumon Hasan" 
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="profession">Profession</Label>
                        <Input 
                          id="profession" 
                          type="text" 
                          placeholder="Software Developer" 
                          value={formData.profession}
                          onChange={handleInputChange}
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
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input 
                        id="date_of_birth" 
                        type="date" 
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        type="text" 
                        placeholder="+1234567890" 
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      type="text" 
                      placeholder="123 Main St, City, Country" 
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      rows={4}
                      placeholder="Tell us about yourself..."
                      value={formData.bio}
                      onChange={handleInputChange}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Brief description for your profile.</p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
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
