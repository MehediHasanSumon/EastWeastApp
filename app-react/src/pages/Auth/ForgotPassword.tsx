import { AxiosError } from "axios";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router";
import AuthForm from "../../components/AuthForm";
import request from "../../service/AxiosInstance";
import { ForgotPasswordFormController } from "../../utils/FormController/AuthFormController";
import { toastError } from "../../utils/Toast";

const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initialValues = {
    email: "",
  };

  const validate = (values: typeof initialValues) => {
    const errors: Record<string, string> = {};
    if (!values.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = "Invalid email format";
    }
    return errors;
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setIsLoading(true);
    try {
      const res = await request.post("/api/forgot-password", values);
      if (res.status === 200) {
        setIsSubmitted(true);
      }
    } catch (error: unknown) {
      console.log(error);
      if (error instanceof AxiosError) {
        if (error.response?.status === 400 || error.response?.status === 404) {
          toastError(error.response.data.message);
        } else {
          toastError("Something went wrong! Please try again.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
      >
        <div className="text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="mt-6 text-center text-3xl font-extrabold">Forgot your password?</h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {isSubmitted
                ? "We've sent a password reset link to your email"
                : "Enter your email and we'll send you a reset link"}
            </p>
          </motion.div>
        </div>

        {!isSubmitted ? (
          <AuthForm
            fields={ForgotPasswordFormController}
            initialValues={initialValues}
            validate={validate}
            onSubmit={handleSubmit}
            buttonText="Send Reset Link"
            loading={isLoading}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4"
            >
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </motion.div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Check your email for the password reset link. If you don't see it, please check your spam folder.
            </p>
          </motion.div>
        )}

        <motion.div
          className="text-center text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Back to login
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
