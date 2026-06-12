import { useState } from "react";
import { FiBell, FiSettings } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Header({ open }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const name = user?.fullName || "User";
  const firstLetter = name.charAt(0).toUpperCase();

  const [menu, setMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div
      className="
        fixed top-0 right-0 h-14 bg-[#0b0f1a]
        border-b border-gray-800 flex items-center justify-between
        px-4 z-30
      "
      style={{
        marginLeft: open ? "16rem" : "4rem",
        width: open ? "calc(100% - 16rem)" : "calc(100% - 4rem)",
        transition: "all 300ms ease",
      }}
    >
      {/* LEFT - BRAND */}
      <div className="text-white font-bold text-lg">
        {!open ? "ProjectHub" : ""}
      </div>

      {/* RIGHT - ICONS */}
      <div className="flex items-center gap-4 relative">

        {/* Notification */}
        <button className="text-gray-300 hover:text-white text-xl">
          <FiBell />
        </button>

        {/* Settings (giữ ở header như bạn muốn) */}
        <button
          onClick={() => navigate("/settings")}
          className="text-gray-300 hover:text-white text-xl"
        >
          <FiSettings />
        </button>

        {/* AVATAR */}
        <div className="relative">
          <button
            onClick={() => setMenu(!menu)}
            className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold"
          >
            {firstLetter}
          </button>

          {/* DROPDOWN (chỉ Logout) */}
          {menu && (
  <div className="absolute right-0 mt-2 w-36 bg-[#111] border border-gray-700 rounded shadow-lg text-sm">

    <button
      onClick={() => {
        setMenu(false);
        navigate("/profile");
      }}
      className="w-full text-left px-3 py-2 hover:bg-gray-800"
    >
      Profile
    </button>

    <button
      onClick={handleLogout}
      className="w-full text-left px-3 py-2 hover:bg-red-600"
    >
      Logout
    </button>

  </div>
)}
        </div>
      </div>
    </div>
  );
}