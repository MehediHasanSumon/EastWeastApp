import { motion } from "framer-motion";
import ActivityFeed from "../../components/Admin/ActivityFeed";
import Chart from "../../components/Admin/Chart";
import AdminLayout from "../../layouts/Admin/AdminLayout";

const Dashboard = () => {
  // const stats = [
  //   {
  //     title: "Total Revenue",
  //     value: "৳24,780",
  //     change: "+12.5%",
  //     icon: "currency-dollar",
  //   },
  //   { title: "New Users", value: "1,254", change: "+8.2%", icon: "users" },
  //   {
  //     title: "Pending Orders",
  //     value: "56",
  //     change: "-3.1%",
  //     icon: "shopping-cart",
  //   },
  //   {
  //     title: "Active Projects",
  //     value: "14",
  //     change: "+2.3%",
  //     icon: "briefcase",
  //   },
  // ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <h1 className="text-2xl font-bold mb-2">Welcome back, Admin!</h1>
          <p className="opacity-90">Here's what's happening with your projects today.</p>
        </motion.div>

        {/* Stats Grid */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </motion.div> */}

        {/* Charts and Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2">
            <Chart title="Revenue Overview" />
          </div>
          <div>
            <ActivityFeed />
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
