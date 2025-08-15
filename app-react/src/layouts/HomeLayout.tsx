import { type ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router";
import Footer from "../components/Footer";
import LiveChat from "../components/LiveChat";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar";
import type { RootState } from "../interface/types";

interface HomeLayoutProps {
  children: ReactNode;
}

const HomeLayout = ({ children }: HomeLayoutProps) => {
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <Loading />;
  }
  if (user && user.verifyAt === null) {
    return <Navigate to="/email-verification" replace />;
  }

  return (
    <>
      <Navbar />
      {children}
      <LiveChat />
      <Footer />
    </>
  );
};

export default HomeLayout;
