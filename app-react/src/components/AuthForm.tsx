import { motion } from "framer-motion";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router";

interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
}

interface AuthFormProps<T extends Record<string, string>> {
  fields: FormField[];
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T & { rememberMe?: boolean }) => void;
  buttonText: string;
  loading?: boolean;
  showTerms?: boolean;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
  forgotPasswordLink?: string;
  termsLink?: string;
}

const AuthForm = <T extends Record<string, string>>({
  fields,
  initialValues,
  validate,
  onSubmit,
  buttonText,
  loading = false,
  showTerms = false,
  showRememberMe = false,
  showForgotPassword = false,
  forgotPasswordLink = "/forgot-password",
  termsLink = "#",
}: AuthFormProps<T>) => {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [showPasswordFields, setShowPasswordFields] = useState<Record<string, boolean>>({});
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (errors[name as keyof T]) {
      const newErrors = { ...errors };
      delete newErrors[name as keyof T];
      setErrors(newErrors);
    }
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswordFields({
      ...showPasswordFields,
      [fieldName]: !showPasswordFields[fieldName],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate ? validate(formData) : {};
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit({ ...formData, ...(showRememberMe ? { rememberMe } : {}) });
    }
  };

  const getInputType = (field: FormField): string => {
    if (field.type === "password") {
      return showPasswordFields[field.name] ? "text" : "password";
    }
    return field.type;
  };

  const getAutoComplete = (field: FormField): string => {
    if (field.name === "email") return "email";
    if (field.name.includes("password")) {
      return field.name === "password" ? "current-password" : "new-password";
    }
    if (field.name === "name") return "name";
    return "";
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-md shadow-sm space-y-4">
        {fields.map((field, index) => (
          <motion.div
            key={field.name}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className={field.type === "password" ? "relative" : ""}
          >
            <label htmlFor={field.name} className="sr-only">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={getInputType(field)}
              autoComplete={getAutoComplete(field)}
              required
              className={`appearance-none relative block w-full px-4 py-3 border ${
                errors[field.name] ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700`}
              placeholder={field.placeholder}
              value={formData[field.name] || ""}
              onChange={handleChange}
              disabled={loading}
            />
            {field.type === "password" && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => togglePasswordVisibility(field.name)}
                disabled={loading}
              >
                {showPasswordFields[field.name] ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                )}
              </button>
            )}
            {errors[field.name] && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-600 dark:text-red-400"
              >
                {errors[field.name]}
              </motion.p>
            )}
          </motion.div>
        ))}
      </div>

      {(showTerms || showRememberMe) && (
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {showRememberMe && (
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Remember me
              </label>
            </div>
          )}
          {showForgotPassword && (
            <div className="text-sm">
              <Link
                to={forgotPasswordLink}
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Forgot your password?
              </Link>
            </div>
          )}
          {showTerms && (
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                disabled={loading}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                I agree to the{" "}
                <a
                  href={termsLink}
                  className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Terms and Conditions
                </a>
              </label>
            </div>
          )}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <motion.button
          type="submit"
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
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
              Processing...
            </span>
          ) : (
            buttonText
          )}
        </motion.button>
      </motion.div>
    </form>
  );
};

export default AuthForm;
