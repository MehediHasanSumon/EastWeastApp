import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { HiOutlineMail } from "react-icons/hi";
import AdminLayout from "../../../layouts/Admin/AdminLayout";
import AdminSettingLayout from "../../../layouts/Admin/AdminSettingLayout";
import Input from "../../../components/ui/Input";
import Label from "../../../components/ui/Label";
import request from "../../../service/AxiosInstance";
import { toastSuccess, toastError } from "../../../utils/Toast";

const AccountEmailSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [formData, setFormData] = useState({
    newEmail: "",
    confirmEmail: ""
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [currentEmail, setCurrentEmail] = useState("");

  // Load current user email on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await request.get('/api/me/profile');
        if (response.data.status && response.data.user) {
          setCurrentEmail(response.data.user.email || "");
        }
      } catch (error: any) {
        console.error('Error loading user profile:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load profile';
        toastError(errorMessage);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.newEmail.trim()) {
      newErrors.newEmail = "New email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
      newErrors.newEmail = "Please enter a valid email address";
    }

    if (!formData.confirmEmail.trim()) {
      newErrors.confirmEmail = "Please confirm your email";
    } else if (formData.newEmail !== formData.confirmEmail) {
      newErrors.confirmEmail = "Emails do not match";
    }

    // Check if new email is same as current
    if (formData.newEmail.trim() === currentEmail) {
      newErrors.newEmail = "New email must be different from current email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await request.put('/api/me/email', {
        email: formData.newEmail.trim()
      });
      
      if (response.data.status) {
        toastSuccess('Email updated successfully! Please verify your new email address.');
        console.log('Email updated successfully:', response.data.user);
        
        // Update current email and reset form
        setCurrentEmail(formData.newEmail.trim());
        setFormData({ newEmail: "", confirmEmail: "" });
        setErrors({});
      }
    } catch (error: any) {
      console.error('Error updating email:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update email';
      toastError(errorMessage);
      
      // Set server error
      if (error.response?.data?.message) {
        setErrors(prev => ({
          ...prev,
          server: error.response.data.message
        }));
      }
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
            <HiOutlineMail className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Email Settings</h2>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6">
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading profile...</span>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="currentEmail">Current Email</Label>
                  <Input
                    id="currentEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={currentEmail}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                  />
                </div>

                <div>
                  <Label htmlFor="newEmail">New Email *</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="new-email@example.com"
                    value={formData.newEmail}
                    onChange={handleInputChange}
                    className={errors.newEmail ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {errors.newEmail && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newEmail}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmEmail">Confirm New Email *</Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    placeholder="new-email@example.com"
                    value={formData.confirmEmail}
                    onChange={handleInputChange}
                    className={errors.confirmEmail ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {errors.confirmEmail && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmEmail}</p>
                  )}
                </div>

                {errors.server && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.server}</p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <HiOutlineMail className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> After updating your email, you'll need to verify the new email address to maintain access to your account.
                      </p>
                    </div>
                  </div>
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
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Email</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </AdminSettingLayout>
    </AdminLayout>
  );
};

export default AccountEmailSettings;
