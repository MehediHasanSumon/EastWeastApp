import { AxiosError } from "axios";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import AuthForm from "../../components/AuthForm";
import request from "../../service/AxiosInstance";
import { ConfirmPasswordFormController } from "../../utils/FormController/AuthFormController";
import { toastError } from "../../utils/Toast";

const ConfirmPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  const initialValues = {
    password: "",
    confirm_password: "",
  };

  useEffect(() => {
    const sendUserEmailVarificationCode = async () => {
      try {
        await request.get(`/api/check-reset-password-token/${token}`);
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response?.status === 404) {
            toastError(error.response.data.message, 5000);
            navigate("/forgot-password");
          } else {
            toastError("Something went wrong! Please try again.");
          }
        }
      }
    };

    sendUserEmailVarificationCode();
  }, [navigate, token]);

  const validate = (values: typeof initialValues) => {
    const errors: Record<string, string> = {};

    if (!values.password) {
      errors.password = "Password is required";
    } else if (values.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!values.confirm_password) {
      errors.confirm_password = "Confirmation is required";
    } else if (values.confirm_password !== values.password) {
      errors.confirm_password = "Passwords do not match";
    }

    return errors;
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setIsLoading(true);

    try {
      const res = await request.post(`/api/confirm-password/${token}`, values);
      if (res.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 5000);
      }
    } catch (error: unknown) {
      console.log(error);
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          toastError(error.response.data.message, 5000);
          navigate("/forgot-password", { replace: true });
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
            <h2 className="mt-6 text-center text-3xl font-extrabold">Reset your password</h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {success ? "Your password has been reset successfully!" : "Enter your new password below"}
            </p>
          </motion.div>
        </div>

        {!success ? (
          <AuthForm
            fields={ConfirmPasswordFormController}
            initialValues={initialValues}
            validate={validate}
            onSubmit={handleSubmit}
            buttonText="Reset Password"
            loading={isLoading}
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4"
            >
              <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </motion.div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">You can now sign in with your new password.</p>
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Back to login
            </Link>
          </motion.div>
        )}

        {!success && (
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
              Remember your password? Sign in
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ConfirmPassword;
