import { motion } from "framer-motion";
import { HiOutlineMail } from "react-icons/hi";
import AdminLayout from "../../../layouts/Admin/AdminLayout";
import AdminSettingLayout from "../../../layouts/Admin/AdminSettingLayout";

const AccountEmailSettings = () => {
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
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                  placeholder="john@example.com"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                  placeholder="new-email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                  placeholder="new-email@example.com"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Update Email
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </AdminSettingLayout>
    </AdminLayout>
  );
};

export default AccountEmailSettings;
