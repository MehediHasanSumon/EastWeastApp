import { useState } from "react";

const Admin: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="antialiased bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen transition-all duration-500">
      {/* Top Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 py-3 dark:bg-gray-800/80 dark:border-gray-700/50 fixed left-0 right-0 top-0 z-50 shadow-sm">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 mr-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 lg:hidden"
              aria-label="Toggle Sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
                />
              </svg>
            </button>

            {/* Logo / Dashboard Title */}
            <a href="#" className="flex items-center group">
              <span className="self-center text-xl font-bold whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 group-hover:from-indigo-600 group-hover:to-purple-700 transition-all duration-300">
                Dashboard Pro
              </span>
            </a>
          </div>

          {/* Right-side Nav Items */}
          <div className="flex items-center space-x-4 lg:order-2">
            {/* Notifications Button with Hover */}
            <div
              className="relative"
              onMouseEnter={() => setNotificationOpen(true)}
              onMouseLeave={() => setNotificationOpen(false)}
            >
              <button
                className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 relative"
                aria-label="Notifications"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl divide-y divide-gray-200/50 dark:divide-gray-600/50 dark:bg-gray-700 z-50 animate-fadeIn">
                  <div className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-white bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-600 dark:to-gray-700 rounded-t-lg">
                    Notifications
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {[1, 2].map((i) => (
                      <a
                        key={i}
                        href="#"
                        className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-600/50 rounded-md transition-all duration-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <img
                              src={`https://picsum.photos/id/${10 + i}/40/40`}
                              alt="User"
                              className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-600"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                              {i === 1 ? "New message from Sarah" : "Your post got 24 likes"}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {i === 1 ? "5 minutes ago" : "1 hour ago"}
                            </span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                  <a
                    href="#"
                    className="block px-4 py-3 text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-600/50 rounded-b-lg transition-colors duration-200"
                  >
                    View all notifications
                  </a>
                </div>
              )}
            </div>

            {/* User Avatar with Hover */}
            <div
              className="relative"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <button
                className="flex text-sm rounded-full focus:outline-none transition-all duration-300"
                aria-label="User Menu"
              >
                <img
                  src="https://picsum.photos/id/30/40/40"
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full ring-2 ring-indigo-500 dark:ring-indigo-400 hover:ring-4 transition-all duration-300"
                />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute top-12 right-0 w-48 bg-white rounded-lg shadow-xl dark:bg-gray-700 z-50 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-600/50">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">Jessica Smith</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">jessica@example.com</p>
                  </div>
                  <ul className="py-1 text-sm text-gray-700 dark:text-gray-300">
                    <li>
                      <a
                        href="#"
                        className="block px-4 py-2 hover:bg-indigo-50 dark:hover:bg-gray-600/50 transition-colors duration-200"
                      >
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Profile
                        </span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="block px-4 py-2 hover:bg-indigo-50 dark:hover:bg-gray-600/50 transition-colors duration-200"
                      >
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Settings
                        </span>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="block px-4 py-2 hover:bg-indigo-50 dark:hover:bg-gray-600/50 transition-colors duration-200"
                      >
                        <span className="flex items-center text-red-500 dark:text-red-400">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Sign Out
                        </span>
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 z-40 w-64 h-full transition-all duration-500 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 bg-gradient-to-b from-indigo-700 to-indigo-900 text-white pt-6 pb-4 overflow-y-auto shadow-xl`}
      >
        <div className="px-4 mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Menu
          </h2>
        </div>
        <ul className="space-y-1 px-2">
          {[
            {
              icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
              text: "Overview",
              active: true,
            },
            {
              icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
              text: "Projects",
            },
            {
              icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
              text: "Messages",
              badge: 3,
            },
            {
              icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
              text: "Settings",
            },
          ].map((item, index) => (
            <li key={index}>
              <a
                href="#"
                className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                  item.active ? "bg-white/20 backdrop-blur-md shadow-md" : "hover:bg-white/10 hover:backdrop-blur-md"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span className="ml-3">{item.text}</span>
                {item.badge && (
                  <span className="inline-flex items-center justify-center ml-auto w-5 h-5 text-xs font-semibold rounded-full bg-white text-indigo-600">
                    {item.badge}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
        <ul className="mt-8 pt-4 border-t border-indigo-600/50 space-y-1 px-2">
          {[
            {
              icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              text: "Documents",
            },
            {
              icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
              text: "Components",
            },
          ].map((item, index) => (
            <li key={index}>
              <a
                href="#"
                className="flex items-center p-3 rounded-lg hover:bg-white/10 hover:backdrop-blur-md transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span className="ml-3">{item.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className={`pt-20 pb-6 px-4 transition-all duration-500 ${sidebarOpen ? "lg:ml-64" : ""} min-h-screen`}>
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome back, Jessica!</h1>
          <p className="opacity-90">Here's what's happening with your projects today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            {
              title: "Total Revenue",
              value: "$24,780",
              change: "+12.5%",
              icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            },
            {
              title: "New Users",
              value: "1,254",
              change: "+8.2%",
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
            },
            {
              title: "Pending Orders",
              value: "56",
              change: "-3.1%",
              icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
            },
            {
              title: "Active Projects",
              value: "14",
              change: "+2.3%",
              icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center justify-between hover:shadow-lg transition-shadow duration-300"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {stat.title}
                </h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                <p
                  className={`mt-1 text-sm ${
                    stat.change.startsWith("+")
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {stat.change} from last week
                </p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Revenue Overview</h3>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-full">
                  Monthly
                </button>
                <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                  Weekly
                </button>
              </div>
            </div>
            <div className="h-64 bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
              {/* Chart placeholder */}
              <div className="flex items-end h-full space-x-2">
                {[30, 60, 45, 80, 60, 90, 70, 100, 80, 60, 90, 110].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-indigo-400 to-indigo-600 rounded-t-lg hover:from-indigo-500 hover:to-indigo-700 transition-all duration-300"
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-6">Recent Activity</h3>
            <ul className="space-y-4">
              {[
                {
                  user: "Alex Johnson",
                  action: "completed project",
                  time: "2 mins ago",
                },
                {
                  user: "Sarah Williams",
                  action: "commented on ticket",
                  time: "1 hour ago",
                },
                {
                  user: "Michael Brown",
                  action: "updated dashboard",
                  time: "3 hours ago",
                },
                {
                  user: "Emily Davis",
                  action: "created new task",
                  time: "5 hours ago",
                },
              ].map((activity, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <img
                    src={`https://picsum.photos/id/${20 + i}/40/40`}
                    alt={activity.user}
                    className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-600"
                  />
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};
export default Admin;
