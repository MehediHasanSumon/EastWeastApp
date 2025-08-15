import { useUser } from "../context/UserContext";

const ChangeEmail = () => {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Change Email</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Email
          </label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="Enter new email"
          />
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Update Email
        </button>
      </div>
    </div>
  );
};

export default ChangeEmail;
