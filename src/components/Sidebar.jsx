import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiFolder, FiUsers, FiX, FiChevronRight } from "react-icons/fi";

export default function Sidebar({ open, setOpen, mobileOpen, setMobileOpen }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("user"));
    setUser(data);
  }, []);

  const menu = [
    { name: "Thống Kê",  path: "/dashboard", icon: <FiHome /> },
    { name: "Dự Án",     path: "/project",   icon: <FiFolder /> },
    { name: "Nhóm",      path: "/team",       icon: <FiUsers /> },
  ];

  // Đóng mobile drawer khi navigate
  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────── */}
      <div
        className={`
          hidden lg:flex
          fixed top-0 left-0 h-screen
          bg-white dark:bg-[#0b0f1a]
          border-r border-gray-200 dark:border-gray-800
          flex-col z-30
          transition-all duration-300 ease-in-out
          ${open ? "w-64" : "w-16 items-center"}
        `}
      >
        {/* Logo & Toggle */}
        <div className={`flex items-center w-full p-4 ${open ? "justify-between" : "justify-center"}`}>
          {open && (
            <h1
              onClick={() => navigate("/dashboard")}
              className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer select-none"
            >
              ProjectHub
            </h1>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            title={open ? "Thu gọn" : "Mở rộng"}
          >
            <span
              className={`text-lg transition-transform duration-300 block ${open ? "rotate-0" : "rotate-180"}`}
            >
              <FiChevronRight />
            </span>
          </button>
        </div>

        {/* Menu */}
        <ul className="space-y-1 text-gray-600 dark:text-gray-300 flex-1 px-2 w-full mt-2">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  title={!open ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium
                    ${open ? "" : "justify-center"}
                    ${isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {open && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User info (chỉ khi open) */}
        {open && user && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE DRAWER ───────────────────────────── */}
      <div
        className={`
          lg:hidden
          fixed top-0 left-0 h-screen w-72
          bg-white dark:bg-[#0b0f1a]
          border-r border-gray-200 dark:border-gray-800
          flex flex-col z-50
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header drawer */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h1
            onClick={() => { navigate("/dashboard"); handleNavClick(); }}
            className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer select-none"
          >
            ProjectHub
          </h1>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Mobile Menu */}
        <ul className="space-y-1 text-gray-600 dark:text-gray-300 flex-1 px-3 mt-4">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                    ${isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User info mobile */}
        {user && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
