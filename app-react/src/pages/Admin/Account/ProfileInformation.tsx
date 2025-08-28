import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { FaCamera, FaRegUserCircle, FaUpload, FaSpinner } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../../../layouts/Admin/AdminLayout";
import AdminSettingLayout from "../../../layouts/Admin/AdminSettingLayout";
import Input from "../../../components/ui/Input";
import Label from "../../../components/ui/Label";
import Textarea from "../../../components/ui/Textarea";
import request from "../../../service/AxiosInstance";
import { toastSuccess, toastError } from "../../../utils/Toast";
import { setUser } from "../../../app/features/auth/authSlice";
import { getProfileImageUrl, handleProfileImageError } from "../../../utils/profileImage";
import type { RootState } from "../../../app/Store";

const ProfileInformation = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    profession: "",
    date_of_birth: "",
    phone: "",
    address: "",
    bio: ""
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await request.get('/api/me/profile');
        if (response.data.status && response.data.user) {
          const user = response.data.user;
          console.log('Loaded user profile:', user);
          
          setFormData({
            name: user.name || "",
            profession: user.profession || "",
            date_of_birth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : "",
            phone: user.phone || "",
            address: user.address || "",
            bio: user.bio || ""
          });

          if (user.profile_picture) {
            console.log('Setting profile image from API:', user.profile_picture);
            setProfileImage(user.profile_picture);
          }
        }
      } catch (error: any) {
        console.error('Error loading user profile:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load profile';
        toastError(errorMessage);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    // Check if we have user data in Redux store first
    if (user?.profile_picture) {
      console.log('Setting profile image from Redux:', user.profile_picture);
      setProfileImage(user.profile_picture);
    }

    loadUserProfile();
  }, [user?.profile_picture]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.phone.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));

    // Clear error when user starts typing
    if (errors[id]) {
      setErrors(prev => ({
        ...prev,
        [id]: ""
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toastError("File size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toastError("Please select a valid image file");
        return;
      }

      setSelectedFile(file);
      
      // Preview the image
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

  const uploadProfilePicture = async () => {
    if (!selectedFile) {
      toastError("Please select a file to upload");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await request.post('/api/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status) {
        toastSuccess('Profile picture updated successfully!');
        console.log('Upload response:', response.data);
        
        // Update the profile image with the new URL from server
        if (response.data.user?.profile_picture) {
          console.log('New profile picture URL:', response.data.user.profile_picture);
          setProfileImage(response.data.user.profile_picture);
          // Update Redux store with new user data including profile picture
          dispatch(setUser(response.data.user));
        }
        setSelectedFile(null);
      }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload profile picture';
      toastError(errorMessage);
      // Revert to previous image if upload fails
      // You might want to reload the profile data here
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
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

      const response = await request.put('/api/me/profile', payload);

      if (response.data.status) {
        toastSuccess('Profile updated successfully!');
        console.log('Profile updated successfully:', response.data.user);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toastError(errorMessage);
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
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading profile...</span>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-6">
                        <div>
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Sumon Hasan"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                          />
                          {errors.name && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                          )}
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
                            <img 
                              src={profileImage} 
                              alt="Profile" 
                              className="w-full h-full object-cover" 
                              onError={handleProfileImageError}
                            />
                          ) : (
                            <FaRegUserCircle className="w-20 h-20 text-gray-400" />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <FaCamera className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        
                        {selectedFile && (
                          <div className="flex flex-col items-center space-y-2">
                            <button
                              type="button"
                              onClick={uploadProfilePicture}
                              disabled={isUploadingImage}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
                            >
                              {isUploadingImage ? (
                                <>
                                  <FaSpinner className="w-4 h-4 animate-spin" />
                                  <span>Uploading...</span>
                                </>
                              ) : (
                                <>
                                  <FaUpload className="w-4 h-4" />
                                  <span>Upload Picture</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">JPG, PNG, or WEBP. Max size 5MB</p>
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
                          type="tel"
                          placeholder="+1234567890"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                        )}
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
                        disabled={isLoading || isLoadingProfile}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AdminSettingLayout>
    </AdminLayout>
  );
};

export default ProfileInformation;
