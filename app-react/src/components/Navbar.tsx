import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { logout } from "../app/features/auth/authSlice";
import type { RootState } from "../interface/types";
import request from "../service/AxiosInstance";
import { removeAuthCookies } from "../utils/AuthLib";
import { toastError } from "../utils/Toast";
import Loading from "./Loading";
import { MobileNavLink } from "./MobileNavLink";
import { NavbarLink } from "./NavLink";
import ThemeToggle from "./ThemeToggle";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navMenuItems = [
    {
      name: "Home",
      path: "/",
    },
    {
      name: "About",
      path: "/about",
    },
    {
      name: "Projects",
      path: "/projects",
    },
    {
      name: "Blogs",
      path: "/blogs",
    },
    {
      name: "Contact",
      path: "/contact",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.body.style.overflow = isOpen ? "auto" : "hidden";
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    setLoading(true);
    try {
      const response = await request.get("/api/logout");
      if (response.status === 200) {
        dispatch(logout());
        removeAuthCookies();
        return navigate("/", { replace: true });
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400 || error.response?.status === 404) {
          toastError(error.response.data.message);
        } else {
          toastError("Something went wrong! Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return <Loading />;
  }
  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <header
      className={`antialiased sticky top-0 z-50 transition-all transition-discrete duration-300 ${
        scrolled
          ? "shadow-lg bg-white/95 dark:bg-gray-950"
          : "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900"
      }`}
    >
      <nav className="container m-auto border-gray-200 px-4 lg:px-6 py-5 dark:border-gray-700 backdrop-blur-sm">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex justify-start items-center">
            <Link to="/" className="flex items-center group">
              <span className="self-center text-2xl font-bold whitespace-nowrap dark:text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Sumon
              </span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center space-x-8">
            <div className="flex space-x-6">
              {navMenuItems.map((item) => (
                <NavbarLink key={item.path} to={item.path}>
                  {item.name}
                </NavbarLink>
              ))}
            </div>
            <div className="flex items-center space-x-4 ml-6">
              {!user ? (
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  Sign in
                </Link>
              ) : (
                <div className="relative">
                  <button onClick={toggleProfileMenu} className="flex cursor-pointer items-center space-x-2 focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      U
                    </div>
                  </button>
                  <div
                    className={`absolute top-12 right-0 w-48 bg-white rounded-lg shadow-xl dark:bg-gray-700 z-50 transition-all duration-200 ease-out ${
                      showProfileMenu
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-600/50">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">Jessica Smith</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">jessica@example.com</p>
                    </div>
                    <ul className="py-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>
                        <Link
                          to="/profile"
                          onClick={() => setShowProfileMenu(false)}
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
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/settings"
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
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="block w-full cursor-pointer text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-gray-600/50 transition-colors duration-200"
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
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
          <div className="flex lg:hidden items-center">
            <button
              onClick={toggleMenu}
              type="button"
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={closeMenu}
      >
        <div
          className={`fixed top-0 right-0 z-50 h-full w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="flex items-center group" onClick={closeMenu}>
              <span className="text-xl font-bold dark:text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Sumon
              </span>
            </Link>
            <button
              onClick={closeMenu}
              className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
            <div className="space-y-2">
              {navMenuItems.map((item) => (
                <MobileNavLink key={item.path} to={item.path} onClick={closeMenu}>
                  {item.name}
                </MobileNavLink>
              ))}
            </div>
            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => {
                      closeMenu();
                    }}
                    className="block w-full px-4 py-2 text-center rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="block w-full px-4 py-2 text-center rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <MobileNavLink to="/profile" onClick={closeMenu}>
                    Profile
                  </MobileNavLink>
                  <MobileNavLink to="/settings" onClick={closeMenu}>
                    Settings
                  </MobileNavLink>
                  <button
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                    className="block w-full px-4 py-2 cursor-pointer text-left rounded-lg text-sm font-medium text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors"
                  >
                    Log Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
