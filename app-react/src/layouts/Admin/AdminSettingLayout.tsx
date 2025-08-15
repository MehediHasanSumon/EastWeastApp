import type { ReactNode } from "react";
import SettingsSidebar from "../../components/Admin/SettingsSidebar";

interface AdminSettingsLayoutProps {
  children: ReactNode;
}
const AdminSettingLayout = ({ children }: AdminSettingsLayoutProps) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-2 mt-6">
        <SettingsSidebar />
        <main className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">{children}</main>
      </div>
    </div>
  );
};

export default AdminSettingLayout;
