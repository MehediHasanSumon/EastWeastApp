import { motion } from "framer-motion";

const Logo: React.FC = () => {
  return (
    <motion.a href="#" className="flex items-center group" whileHover={{ scale: 1.05 }}>
      <span className="self-center text-xl font-bold whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 group-hover:from-indigo-600 group-hover:to-purple-700 transition-all duration-300">
        Md Mehedi Hasan
      </span>
    </motion.a>
  );
};

export default Logo;
