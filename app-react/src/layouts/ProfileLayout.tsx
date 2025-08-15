import { Outlet } from "react-router";
import ProfileHeader from "../components/ProfileHeader";
import ProfileSidebar from "../components/ProfileSidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ProfileLayout = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <ProfileHeader />

          <div className="flex flex-col md:flex-row gap-6 mt-6">
            <ProfileSidebar />

            <main className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfileLayout;
