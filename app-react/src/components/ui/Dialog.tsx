import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React from "react";

interface DialogProps {
  header: string;
  visible: boolean;
  style?: React.CSSProperties;
  onHide: () => void;
  children: React.ReactNode;
  className?: string;
}

const Dialog: React.FC<DialogProps> = ({ header, visible, style = {}, onHide, children, className = "" }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onHide}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col ${className}`}
            style={{
              width: "40vw",
              maxHeight: "80vh",
              ...style,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{header}</h2>
              <button
                onClick={onHide}
                className="p-1 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto dark:text-gray-300">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Dialog;
