import axios from "axios";
import { toastError } from "./Toast";

export const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || "Something went wrong";
    toastError(message);
  } else {
    toastError("Unexpected error occurred");
  }
};
