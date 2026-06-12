import { useState, useEffect } from "react";

export default function SettingPage() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [msg, setMsg] = useState("");

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  /* ================= THEME FAKE ================= */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  /* ================= PASSWORD (UI ONLY) ================= */
  const handleChangePassword = () => {
    // CHỈ FAKE UI - KHÔNG LOGIC
    setMsg("✔ UI demo: đổi mật khẩu (không xử lý thật)");

    setOldPass("");
    setNewPass("");
  };

  return (
    <div className="text-white max-w-xl">

      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* ================= THEME ================= */}
      <div className="bg-[#0b0f1a] border border-gray-800 p-4 rounded mb-6">

        <h2 className="font-semibold mb-3">Giao diện</h2>

        <button
          onClick={toggleTheme}
          className="px-4 py-2 bg-blue-600 rounded text-white"
        >
          Toggle {theme === "dark" ? "Light" : "Dark"} mode
        </button>

        <p className="text-gray-400 text-sm mt-2">
          Current: {theme}
        </p>

      </div>

      {/* ================= PASSWORD UI ONLY ================= */}
      <div className="bg-[#0b0f1a] border border-gray-800 p-4 rounded">

        <h2 className="font-semibold mb-3">Đổi mật khẩu</h2>

        <input
          type="password"
          placeholder="Mật khẩu cũ"
          value={oldPass}
          onChange={(e) => setOldPass(e.target.value)}
          className="w-full mb-2 p-2 bg-black border border-gray-700 rounded"
        />

        <input
          type="password"
          placeholder="Mật khẩu mới"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="w-full mb-3 p-2 bg-black border border-gray-700 rounded"
        />

        <button
          onClick={handleChangePassword}
          className="px-4 py-2 bg-green-600 rounded text-white"
        >
          Save
        </button>

        {msg && (
          <p className="mt-3 text-sm text-gray-300">{msg}</p>
        )}

      </div>

    </div>
  );
}