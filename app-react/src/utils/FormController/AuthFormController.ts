import type { FormField } from "../../interface/types";

export const RegisterFormController: FormField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Enter Name",
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "Enter Email Address",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "••••••••",
  },
  {
    name: "confirm_password",
    label: "Confirm Password",
    type: "password",
    placeholder: "••••••••",
  },
];

export const LoginFormController: FormField[] = [
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "Enter Email Address",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "••••••••",
  },
];

export const ForgotPasswordFormController: FormField[] = [
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "Enter Email Address",
  },
];

export const ConfirmPasswordFormController: FormField[] = [
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "••••••••",
  },
  {
    name: "confirm_password",
    label: "Confirm Password",
    type: "password",
    placeholder: "••••••••",
  },
];
