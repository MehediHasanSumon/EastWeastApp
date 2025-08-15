import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import Loading from "../components/Loading";
import type { RootState } from "../interface/types";

const AuthMiddleware = () => {
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

  return user ? <Outlet /> : null;
};

export default AuthMiddleware;
