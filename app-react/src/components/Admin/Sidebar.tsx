import { AnimatePresence, motion } from "framer-motion";
import { FaRegNewspaper, FaRegUserCircle } from "react-icons/fa";
import { FiBarChart2, FiCalendar, FiFolder, FiHome, FiMessageCircle } from "react-icons/fi";
import type { IconType } from "react-icons/lib";
import { useSelector } from "react-redux";
import type { RootState } from "../../interface/types";
import NavItem from "./NavItem";
import SubMenu from "./SubMenu";
import UserProfile from "./UserProfile";

export interface MenuItemBase {
  label: string;
  icon: IconType;
  permission?: string;
  badge?: number;
}

export interface MenuLinkItem extends MenuItemBase {
  to: string;
}

export interface MenuSubItem extends MenuItemBase {
  children: MenuLinkItem[];
}

export type MenuItem = MenuLinkItem | MenuSubItem;

const Sidebar = ({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (value: boolean) => void }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const hasPermission = (permissionName?: string) => {
    if (!permissionName) return true;
    if (!user) return false;
    return user.permissions.some((perm: any) => perm.name === permissionName);
  };

  const menuItems: MenuItem[] = [
    {
      label: "Overview",
      to: "/dashboard",
      icon: FiHome,
    },
    {
      label: "Messages",
      to: "/messenger",
      icon: FiMessageCircle,
      badge: 3,
      permission: "view-messages",
    },
    {
      label: "User Management",
      icon: FaRegUserCircle,
      children: [
        { label: "Roles Management", to: "/dashboard/roles", icon: FiFolder, permission: "view-role" },
        { label: "Permissions Management", to: "/dashboard/permissions", icon: FiFolder, permission: "view-permission" },
        { label: "User Management", to: "/dashboard/users", icon: FiFolder, permission: "view-user" },
      ],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => hasPermission(item.permission));

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 z-50 w-64 pt-16 h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col bg-gradient-to-b from-white to-gray-50 border-r border-gray-200/50 dark:from-gray-800 dark:to-gray-900 dark:border-r dark:border-gray-700/50">
          <nav className="flex-1 px-1 py-2 overflow-y-auto">
            <ul className="space-y-1">
              {filteredMenuItems.map((item, index) => {
                if ("children" in item) {
                  return (
                    <SubMenu key={index} title={item.label} icon={item.icon}>
                      {item.children.map((child, childIndex) => (
                        <NavItem key={childIndex} to={child.to} icon={child.icon}>
                          {child.label}
                        </NavItem>
                      ))}
                    </SubMenu>
                  );
                } else {
                  return (
                    <NavItem key={index} to={item.to} icon={item.icon} badge={item.badge}>
                      {item.label}
                    </NavItem>
                  );
                }
              })}
            </ul>
          </nav>

          <UserProfile user={user} />
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
