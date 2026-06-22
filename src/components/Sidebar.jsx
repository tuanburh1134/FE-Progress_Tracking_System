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

  const menu = [
    { name: "Thống Kê", path: "/dashboard" },
    { name: "Dự Án", path: "/project" },
    { name: "Nhóm", path: "/team" },
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-[#0b0f1a] border-r border-gray-800 flex flex-col
      transition-all duration-300 ease-in-out
      ${open ? "w-64" : "w-16 items-center"}`}
    >
      
      {/* HEADER */}
      <div className={`flex items-center w-full p-4 ${open ? "justify-between" : "justify-center"}`}>
        
        {open && (
          <h1
            onClick={() => navigate("/dashboard")}
            className="text-xl font-bold text-white cursor-pointer"
          >
            ProjectHub
          </h1>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="text-white text-xl"
        >
          ☰
        </button>
      </div>

      {/* MENU */}
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
    </div>
  );
}