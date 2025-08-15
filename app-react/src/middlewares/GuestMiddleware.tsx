import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import type { RootState } from "../interface/types";

const GuestMiddleware = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default GuestMiddleware;
