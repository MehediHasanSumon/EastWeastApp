import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import Loading from "../components/Loading";
import type { RootState } from "../interface/types";
import { hasRole } from "../utils/authorization";

const AdminMiddleware = () => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (user.verifyAt === null) {
    return <Navigate to="/email-verification" replace />;
  }

  const roles = hasRole(user);
  const isAllowed = roles.includes("admin") || roles.includes("super-admin");

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default AdminMiddleware;
