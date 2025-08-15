import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { FaHome } from "react-icons/fa";
import { Link, useNavigate } from "react-router";

type BaseErrorPageProps = {
  errorCode: string | number;
  title: string;
  description: string;
  showHomeButton?: boolean;
  additionalContent?: ReactNode;
};

const BaseErrorPage = ({ errorCode, title, description, showHomeButton = true, additionalContent }: BaseErrorPageProps) => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400"
        >
          {errorCode}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-2 text-xl font-medium text-gray-800 dark:text-gray-200"
        >
          {title}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8 text-gray-600 dark:text-gray-400"
        >
          {description}
        </motion.p>

        {showHomeButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
            className="flex justify-center gap-4"
          >
            <button
              onClick={() => navigate(-1)}
              className="inline-flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300 hover:gap-3 transition-all duration-300 group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                  clipRule="evenodd"
                />
              </svg>
              Go Back
            </button>
            |
            <Link
              to="/"
              className="inline-flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300  transition-all duration-300 group"
            >
              <FaHome />
              Return to Homepage
            </Link>
          </motion.div>
        )}

        {additionalContent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-12">
            {additionalContent}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default BaseErrorPage;
