import { motion } from "framer-motion";

interface ChartProps {
  title: string;
}

const Chart = ({ title }: ChartProps) => {
  const data = [30, 60, 45, 80, 60, 90, 70, 100, 80, 60, 90, 110];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 h-full"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          {title}
        </h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-full">
            Monthly
          </button>
          <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
            Weekly
          </button>
        </div>
      </div>
      <div className="h-64 bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
        <div className="flex items-end h-full space-x-1">
          {data.map((height, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
              className="flex-1 bg-gradient-to-t from-indigo-400 to-indigo-600 rounded-t-lg hover:from-indigo-500 hover:to-indigo-700 transition-all duration-300"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Chart;
