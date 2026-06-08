import { FiLogOut } from "react-icons/fi";
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ open, setOpen }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("user"));
    setUser(data);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const name = user?.fullName || "User";
  const firstLetter = name.charAt(0).toUpperCase();

  const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Project", path: "/project" },
    { name: "Team", path: "/team" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-[#0b0f1a] border-r border-gray-800 flex flex-col
      transition-all duration-300 ease-in-out
      ${open ? "w-64" : "w-16 items-center"}`}
    >

      {/* ===== HEADER ===== */}
<div className={`flex items-center w-full p-4 ${open ? "justify-between" : "justify-center"}`}>

  {/* LOGO chỉ khi mở */}
  {open && (
    <h1
      onClick={() => navigate("/dashboard")}
      className="text-xl font-bold text-white cursor-pointer"
    >
      ProjectHub
    </h1>
  )}

  {/* ☰ */}
  <button
    onClick={() => setOpen(!open)}
    className="text-white text-xl"
  >
    ☰
  </button>

</div>

      {/* ===== MENU (chỉ khi mở) ===== */}
      {open && (
        <ul className="space-y-2 text-gray-300 flex-1 px-2 w-full">

          {menu.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}

        </ul>
      )}

      {/* ===== BOTTOM ===== */}
      <div className="mt-auto border-t border-gray-800 p-4 flex justify-center">

        {/* CHỈ AVATAR KHI ĐÓNG */}
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
          {firstLetter}
        </div>

        {/* INFO + LOGOUT chỉ khi mở */}
        {open && (
          <div className="ml-3 flex items-center justify-between w-full">

            <div>
              <p className="text-sm text-white">{name}</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>

            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-500"
            >
              <FiLogOut />
            </button>

          </div>
        )}

      </div>
    </div>
  );
}