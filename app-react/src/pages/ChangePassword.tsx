const ChangePassword = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Change Password</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Password
          </label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="Enter current password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Password
          </label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="Enter new password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="Confirm new password"
          />
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Update Password
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;
