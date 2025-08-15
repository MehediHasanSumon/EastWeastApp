import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import React from "react";
import Button from "./Button";

interface DeleteDialogProps {
  header?: string;
  message?: string;
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  header = "Delete Item",
  message = "Are you sure you want to delete this item?",
  visible,
  onHide,
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{header}</h2>
              </div>
              <button
                onClick={onHide}
                className="p-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

              <div className="flex gap-3 justify-end">
                <Button variant="alternative" onClick={onHide}>
                  {cancelText}
                </Button>
                <Button variant="red" onClick={onConfirm}>
                  {confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteDialog;
