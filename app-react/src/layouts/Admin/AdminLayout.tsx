import { useState, type ReactNode } from "react";
import Header from "../../components/Admin/Header";
import Sidebar from "../../components/Admin/Sidebar";
import Breadcrumb from "../../components/Breadcrumb";

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface AdminLayoutProps {
  breadcrumbItems?: BreadcrumbItem[];
  children: ReactNode;
}

const AdminLayout = ({ breadcrumbItems, children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="antialiased">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className={`pt-20 pb-6 px-4 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : ""} min-h-screen`}>
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={breadcrumbItems || []} isActive={!!breadcrumbItems} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
