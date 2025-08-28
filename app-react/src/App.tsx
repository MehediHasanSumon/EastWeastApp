import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router";
import { authUser, setUser } from "./app/features/auth/authSlice";
import type { AppDispatch, RootState } from "./app/Store";
import AuthMiddleware from "./middlewares/AuthMiddleware";
import GuestMiddleware from "./middlewares/GuestMiddleware";
import AccountEmailSettings from "./pages/Admin/Account/AccountEmailSettings";
import AccountPasswordSettings from "./pages/Admin/Account/AccountPasswordSettings";
import ProfileInformation from "./pages/Admin/Account/ProfileInformation";
import Dashboard from "./pages/Admin/Dashboard";
import InvoiceManagement from "./pages/Admin/Invoice/InvoiceManagement";
import PermissionManagement from "./pages/Admin/Permission/PermissionManagement";
import ProductManagement from "./pages/Admin/Product/ProductManagement";
import RoleManagement from "./pages/Admin/Role/RoleManagement";
import UserManagement from "./pages/Admin/Users/UserManagement";
import ConfirmPasword from "./pages/Auth/ConfirmPasword";
import EmailVerification from "./pages/Auth/EmailVerification";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import InternalServerError from "./pages/Errors/InternalServerError";
import NotFound from "./pages/Errors/NotFound";
import Unauthorized from "./pages/Errors/Unauthorized";
import UnderConstruction from "./pages/Errors/UnderConstruction";
import MessengerPage from "./pages/MessengerPage";
import { getOrCreateDeviceId, hexToString } from "./utils/Lib";
import { getCookie } from "./utils/Storage";
import GlobalCallManager from "./components/Chat/GlobalCallManager";
import GlobalMessageNotifier from "./components/Chat/GlobalMessageNotifier";
import ReportManagement from "./pages/Admin/Report/ReportManagement";
import Settings from "./pages/Admin/Settings/Settings";
import SMSSetting from "./pages/Admin/Settings/SMSSetting";

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

      <Route path="/" element={<AuthMiddleware />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="/messenger" element={<MessengerPage />} />
        {/* User  management*/}
        <Route path="roles" element={<RoleManagement />} />
        <Route path="permissions" element={<PermissionManagement />} />
        <Route path="users" element={<UserManagement />} />

        {/* Product & Invoice management */}
        <Route path="products" element={<ProductManagement />} />
        <Route path="invoices" element={<InvoiceManagement />} />
        <Route path="reports" element={<ReportManagement />} />

        <Route path="settings" element={<Settings />} />
        <Route path="sms-settings" element={<SMSSetting />} />

        <Route path="account-settings" element={<ProfileInformation />} />
        <Route path="email-settings" element={<AccountEmailSettings />} />
        <Route path="password-settings" element={<AccountPasswordSettings />} />
      </Route>
    </Routes>
  );
};

export default App;
