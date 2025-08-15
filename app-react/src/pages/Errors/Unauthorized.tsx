import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import Loading from "../../components/Loading";
import type { RootState } from "../../interface/types";
import BaseErrorPage from "../../layouts/BaseErrorPage";

const Unauthorized = () => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        navigate("/login", { replace: true });
      } else if (user.verifyAt === null) {
        navigate("/email-verification", { replace: true });
      } else if (user.role !== "admin") {
        navigate("/", { replace: true });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <BaseErrorPage
      errorCode="401"
      title="Unauthorized Access"
      description="You don't have permission to view this page. Please log in with the correct credentials."
      additionalContent={<p className="text-xs text-gray-500 dark:text-gray-500">Need access? Contact your administrator</p>}
    />
  );
};

export default Unauthorized;
