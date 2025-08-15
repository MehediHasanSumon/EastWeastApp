interface FieldConfig {
  label: string;
  name: string;
  type: "text" | "email" | "select" | "textarea" | "checkbox" | "radio" | "toggle";
  placeholder?: string;
  required?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    message?: string;
    requiredMessage?: string;
  };
  options?: Array<{
    value: string;
    label: string;
  }>;
}

export const PermissionFormController: FieldConfig[] = [
  {
    label: "Permission Name",
    name: "permission",
    type: "text",
    placeholder: "Enter your Permission Name",
    required: true,
    validation: {
      requiredMessage: "The permission name field is required.",
    },
  },
];
