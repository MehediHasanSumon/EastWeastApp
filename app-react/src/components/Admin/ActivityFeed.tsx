import { motion } from "framer-motion";

const ActivityFeed = () => {
  const activities = [
    {
      user: "Alex Johnson",
      action: "completed project",
      time: "2 mins ago",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    {
      user: "Sarah Williams",
      action: "commented on ticket",
      time: "1 hour ago",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    {
      user: "Michael Brown",
      action: "updated dashboard",
      time: "3 hours ago",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    {
      user: "Emily Davis",
      action: "created new task",
      time: "5 hours ago",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 h-full"
    >
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-6">
        Recent Activity
      </h3>
      <ul className="space-y-4">
        {activities.map((activity, i) => (
          <motion.li
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 * i }}
            className="flex items-start space-x-3"
          >
            <img
              src={activity.avatar}
              alt={activity.user}
              className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-600"
            />
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{activity.user}</span>{" "}
                {activity.action}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {activity.time}
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

export default ActivityFeed;
