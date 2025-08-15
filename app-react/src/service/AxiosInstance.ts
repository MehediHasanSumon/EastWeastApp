import axios from "axios";
import { hexToString } from "../utils/Lib";
import { getCookie } from "../utils/Storage";
import { toastError } from "../utils/Toast";

const request = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_HOST,
  // Do NOT set a global Content-Type. Let axios infer it per request.
  withCredentials: true,
});

request.interceptors.request.use(
  (config) => {
    const refreshToken = getCookie("rt");
    if (refreshToken) {
      const getToken = hexToString(refreshToken);
      config.headers["x-refresh-token"] = getToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      toastError("Unauthorized! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2500);
    }

    return Promise.reject(error);
  }
);

export default request;
