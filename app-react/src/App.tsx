import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router";
import { authUser, setUser } from "./app/features/auth/authSlice";
import type { AppDispatch, RootState } from "./app/Store";
import ProfileLayout from "./layouts/ProfileLayout";
import AdminMiddleware from "./middlewares/AdminMiddleware";
import AuthMiddleware from "./middlewares/AuthMiddleware";
import GuestMiddleware from "./middlewares/GuestMiddleware";
import AccountEmailSettings from "./pages/Admin/Account/AccountEmailSettings";
import AccountPasswordSettings from "./pages/Admin/Account/AccountPasswordSettings";
import AppearanceSettings from "./pages/Admin/Account/AppearanceSettings";
import ProfileInformation from "./pages/Admin/Account/ProfileInformation";
import Dashboard from "./pages/Admin/Dashboard";
import PermissionManagement from "./pages/Admin/Permission/PermissionManagement";
import RoleManagement from "./pages/Admin/Role/RoleManagement";
import UserManagement from "./pages/Admin/Users/UserManagement";
import ConfirmPasword from "./pages/Auth/ConfirmPasword";
import EmailVerification from "./pages/Auth/EmailVerification";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ChangeEmail from "./pages/ChangeEmail";
import ChangePassword from "./pages/ChangePassword";
import InternalServerError from "./pages/Errors/InternalServerError";
import NotFound from "./pages/Errors/NotFound";
import Unauthorized from "./pages/Errors/Unauthorized";
import UnderConstruction from "./pages/Errors/UnderConstruction";
import ProfileInfo from "./pages/ProfileInfo";
import ThemePreferences from "./pages/ThemePreferences";
import MessengerPage from "./pages/MessengerPage";
import { getOrCreateDeviceId, hexToString } from "./utils/Lib";
import { getCookie } from "./utils/Storage";
import GlobalCallManager from "./components/Chat/GlobalCallManager";
import GlobalMessageNotifier from "./components/Chat/GlobalMessageNotifier";

const App = () => {
  return (
    <>
      <Toaster position="bottom-right" reverseOrder={false} />
      <BrowserRouter>
        <>
          <AppRoutes />
          <GlobalCallManager />
          <GlobalMessageNotifier />
        </>
      </BrowserRouter>
    </>
  );
};

const AppRoutes = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const refreshToken = getCookie("rt");
  const token = hexToString(refreshToken as string);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(authUser());
    } else {
      dispatch(setUser(null));
    }
    getOrCreateDeviceId();
  }, [dispatch, location, token]);

  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
      } />
      <Route path="/email-verification" element={<EmailVerification />} />

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/error" element={<InternalServerError />} />
      <Route path="/coming-soon" element={<UnderConstruction />} />
      <Route path="*" element={<NotFound />} />

      <Route element={<GuestMiddleware />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/confirm-password/:token" element={<ConfirmPasword />} />
      </Route>

      <Route path="/dashboard" element={<AdminMiddleware />}>
        <Route index element={<Dashboard />} />

        {/* User  management*/}
        <Route path="roles" element={<RoleManagement />} />
        <Route path="permissions" element={<PermissionManagement />} />
        <Route path="users" element={<UserManagement />} />

        <Route path="account-settings" element={<ProfileInformation />} />
        <Route path="email-settings" element={<AccountEmailSettings />} />
        <Route path="password-settings" element={<AccountPasswordSettings />} />
        <Route path="theme-settings" element={<AppearanceSettings />} />
      </Route>

      <Route element={<AuthMiddleware />}>
        <Route element={<ProfileLayout />}>
          <Route path="/profile" element={<ProfileInfo />} />
          <Route path="/email" element={<ChangeEmail />} />
          <Route path="/password" element={<ChangePassword />} />
          <Route path="/theme" element={<ThemePreferences />} />
        </Route>
        <Route path="/messenger" element={<MessengerPage />} />
      </Route>
    </Routes>
  );
};

export default App;
