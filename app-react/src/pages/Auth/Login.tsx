import { AxiosError } from "axios";
import { motion } from "framer-motion";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router";
import { setUser } from "../../app/features/auth/authSlice";
import type { AppDispatch } from "../../app/Store";
import AuthForm from "../../components/AuthForm";
import request from "../../service/AxiosInstance";
import { setUserdata } from "../../utils/AuthLib";
import { LoginFormController } from "../../utils/FormController/AuthFormController";
import { getCookie } from "../../utils/Storage";
import { toastError } from "../../utils/Toast";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const initialValues = {
    email: "",
    password: "",
  };

  const validate = (values: typeof initialValues) => {
    const errors: Record<string, string> = {};

    if (!values.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = "Invalid email format";
    }

    if (!values.password) {
      errors.password = "Password is required";
    } else if (values.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    return errors;
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setIsLoading(true);
    const deviceId = getCookie("dvcid") || null;
    const updatedValues = { ...values, deviceId };

    try {
      const res = await request.post("/api/login", updatedValues);
      if (res.status === 201) {
        setUserdata(res);
        dispatch(setUser(res.data.user));
        navigate("/");
      }
    } catch (error: unknown) {
      console.log(error);
      if (error instanceof AxiosError) {
        if (error.response?.status === 401 || error.response?.status === 400) {
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="mt-6 text-center text-3xl font-extrabold">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              register for free
            </Link>
          </p>
        </motion.div>
        <AuthForm
          fields={LoginFormController}
          initialValues={initialValues}
          validate={validate}
          onSubmit={handleSubmit}
          buttonText="Login"
          loading={isLoading}
          showForgotPassword={true}
          showRememberMe={true}
        />
      </motion.div>
    </div>
  );
};

export default Login;
