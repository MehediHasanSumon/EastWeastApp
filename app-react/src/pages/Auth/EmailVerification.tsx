import { AxiosError } from "axios";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import type { RootState } from "../../interface/types";
import request from "../../service/AxiosInstance";
import { toastError, toastSuccess } from "../../utils/Toast";

const EmailVerification = () => {
  const [codes, setCodes] = useState<string[]>(Array(6).fill(""));
  const [activeInput, setActiveInput] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [resendTime, setResendTime] = useState<number>(30);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const checkUserExistOrNotVerify = () => {
      if (!user) {
        return navigate("/unauthorized");
      }
      if (user.verifyAt !== null) {
        return navigate("/");
      }
    };
    checkUserExistOrNotVerify();
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/[^0-9]/g, "");

    if (value) {
      const newCodes = [...codes];
      newCodes[index] = value;
      setCodes(newCodes);

      if (index < 5) {
        setActiveInput(index + 1);
      }
    } else {
      const newCodes = [...codes];
      newCodes[index] = "";
      setCodes(newCodes);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      setActiveInput(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").replace(/[^0-9]/g, "");

    if (pasteData.length === 6) {
      const newCodes = pasteData.split("").slice(0, 6);
      setCodes(newCodes);
      setActiveInput(5);
    }
  };

  useEffect(() => {
    const sendUserEmailVarificationCode = async () => {
      try {
        const response = await request.get("/api/send-email-varification-code");
        if (response.status === 200) {
          toastSuccess(response.data.message);
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response?.status === 400 || error.response?.status === 404) {
            toastError(error.response.data.message);
          } else {
            toastError("Something went wrong! Please try again.");
          }
        }
      }
    };

    sendUserEmailVarificationCode();
  }, []);

  useEffect(() => {
    if (inputsRef.current[activeInput]) {
      inputsRef.current[activeInput]?.focus();
    }
  }, [activeInput]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTime > 0) {
      timer = setTimeout(() => setResendTime(resendTime - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = codes.join("");

    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await request.post("/api/varification-user-email", { token: parseInt(verificationCode) });
      if (res.status === 200) {
        navigate("/");
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

  const handleResendCode = async () => {
    if (resendTime > 0) return;

    setResendTime(30);
    setCodes(Array(6).fill(""));
    setActiveInput(0);
    setError("");

    try {
      const response = await request.get("/api/send-email-varification-code");
      if (response.status === 200) {
        toastSuccess(response.data.message);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400 || error.response?.status === 404) {
          toastError(error.response.data.message);
        } else {
          toastError("Something went wrong! Please try again.");
        }
      }
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
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">Verify your email</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            We've sent a 6-digit code to your email
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="verification-code" className="sr-only">
                Verification Code
              </label>
              <div className="flex justify-between space-x-2" onPaste={handlePaste}>
                {codes.map((code, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputsRef.current[index] = el;
                    }}
                    value={code}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onClick={() => setActiveInput(index)}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    required
                    className={`text-center appearance-none relative block w-full px-3 py-3 border ${
                      error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 transition-all`}
                  />
                ))}
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </div>

          <div className="text-sm text-center">
            <span className="text-gray-500 dark:text-gray-400">Didn't receive a code? </span>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendTime > 0}
              className={`font-medium ${
                resendTime > 0
                  ? "text-gray-400 dark:text-gray-500"
                  : "text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              }`}
            >
              {resendTime > 0 ? `Resend in ${resendTime}s` : "Resend now"}
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || codes.some((code) => !code)}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                isLoading || codes.some((code) => !code) ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Verify Email"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EmailVerification;
