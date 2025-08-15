import React, { useState } from "react";
import Checkbox from "./Checkbox";
import Input from "./Input";
import Label from "./Label";
import Radio from "./Radio";
import { Option, Select } from "./Select";
import Textarea from "./Textarea";
import Toggle from "./Toggle";

type FieldType = "text" | "email" | "number" | "select" | "textarea" | "checkbox" | "radio" | "toggle";

interface FormOption {
  value: string;
  label: string;
}

interface FieldConfig {
  label: string;
  name: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: FormOption[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    message?: string;
    requiredMessage?: string;
  };
}

interface FormProps {
  fields: FieldConfig[];
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  buttonText?: string;
  loading?: boolean;
}

const Form: React.FC<FormProps> = ({ fields, initialValues, onSubmit, buttonText = "Submit", loading = false }) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: FieldConfig, value: any): string => {
    if (field.required && (!value || (typeof value === "string" && value.trim() === ""))) {
      return field.validation?.requiredMessage || `${field.label} is required`;
    }

    if (field.validation && value) {
      const { minLength, maxLength, pattern, message } = field.validation;

      if (minLength && value.length < minLength) {
        return message || `${field.label} must be at least ${minLength} characters`;
      }

      if (maxLength && value.length > maxLength) {
        return message || `${field.label} must be no more than ${maxLength} characters`;
      }

      if (pattern && !pattern.test(value)) {
        return message || `${field.label} format is invalid`;
      }
    }

    if (field.type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
    }

    return "";
  };

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));

    const field = fields.find((f) => f.name === name);
    if (field) {
      const error = validateField(field, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const error = validateField(field, values[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    setTouched(fields.reduce((acc, field) => ({ ...acc, [field.name]: true }), {}));

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(values);
    }
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name} required={field.required}>
            {field.label}
          </Label>

          {field.type === "text" || field.type === "email" || field.type === "number" ? (
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={values[field.name] || ""}
              error={touched[field.name] ? errors[field.name] : ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
            />
          ) : field.type === "select" ? (
            <Select
              id={field.name}
              value={values[field.name] || ""}
              error={touched[field.name] ? errors[field.name] : ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
            >
              {field.options?.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          ) : field.type === "textarea" ? (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={values[field.name] || ""}
              error={touched[field.name] ? errors[field.name] : ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
            />
          ) : field.type === "checkbox" ? (
            <Checkbox
              id={field.name}
              label={field.label}
              checked={values[field.name] || false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.name, e.target.checked)}
            />
          ) : field.type === "radio" ? (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <Radio
                  key={option.value}
                  id={`${field.name}-${option.value}`}
                  name={field.name}
                  label={option.label}
                  checked={values[field.name] === option.value}
                  onChange={() => handleChange(field.name, option.value)}
                />
              ))}
            </div>
          ) : field.type === "toggle" ? (
            <Toggle
              id={field.name}
              label={field.label}
              checked={values[field.name] || false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.name, e.target.checked)}
            />
          ) : null}

          {touched[field.name] && errors[field.name] && (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{errors[field.name]}</span>
            </div>
          )}
        </div>
      ))}

      <div className="pt-3 flex justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className={`flex text-white cursor-pointer bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2 text-center me-2 mb-2 ${
            loading ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
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
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>{buttonText}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Form;
