import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiEdit2, FiCheck, FiX, FiLogOut, FiFolder } from "react-icons/fi";
import useAuthStore from "../store/authStore";
import { STORAGE_KEYS } from "../constants";

export default function ProfilePage() {
  const navigate = useNavigate();
  const storeUser = useAuthStore((s) => s.user);

  const getUser = () => {
    try {
      return (
        storeUser ||
        JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_INFO) || "null") ||
        JSON.parse(localStorage.getItem("user") || "null")
      );
    } catch {
      return null;
    }
  };

  const [user, setUser]           = useState(getUser);
  const [editName, setEditName]   = useState(false);
  const [newName, setNewName]     = useState("");
  const [projects, setProjects]   = useState([]);
  const [saved, setSaved]         = useState(false);

  const [editGithub, setEditGithub] = useState(false);
  const [newGithub, setNewGithub]   = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const { default: apiClient } = await import("../services/api");
      const res = await apiClient.get("/users/profile");
      const uData = res.data?.data;
      if (uData) {
        setUser(uData);
        setNewName(uData.fullName || uData.username || "");
        setNewGithub(uData.githubUsername || "");
        // Đồng bộ localStorage & authStore
        localStorage.setItem("user", JSON.stringify(uData));
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(uData));
        useAuthStore.getState().setAuth(uData, localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN));
      }
    } catch (err) {
      console.warn("Không thể fetch profile từ backend:", err);
      const u = getUser();
      setUser(u);
      setNewName(u?.fullName || u?.username || "");
      setNewGithub(u?.githubUsername || "");
    }
  }, []);

  useEffect(() => {
    loadProfile();
    const allProjects = JSON.parse(localStorage.getItem("projects") || "[]");
    setProjects(allProjects);
  }, [loadProfile]);

  const handleSaveProfile = async (updatedFields) => {
    try {
      const { default: apiClient } = await import("../services/api");
      const payload = {
        fullName: updatedFields.fullName !== undefined ? updatedFields.fullName : (user.fullName || user.username),
        githubUsername: updatedFields.githubUsername !== undefined ? updatedFields.githubUsername : (user.githubUsername || ""),
      };
      
      const res = await apiClient.put("/users/profile", payload);
      const updated = res.data?.data;
      if (updated) {
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updated));
        useAuthStore.getState().setAuth(updated, localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Lỗi cập nhật profile:", err);
      alert("Cập nhật thông tin thất bại. Vui lòng thử lại.");
    }
  };

  const handleSaveName = () => {
    if (!newName.trim()) return;
    handleSaveProfile({ fullName: newName.trim() });
    setEditName(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    useAuthStore.getState().clearAuth();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#070b14]">
        <p className="text-gray-500 dark:text-gray-400">Chưa đăng nhập. <a href="/login" className="text-blue-500 underline">Đăng nhập</a></p>
      </div>
    );
  }

  const firstLetter = (user.fullName || user.username || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070b14] p-6 text-gray-900 dark:text-white">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── HEADER CARD ─────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
              {firstLetter}
            </div>

            <div className="flex-1 min-w-0">
              {/* Tên hiển thị */}
              {editName ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditName(false); }}
                    className="flex-1 text-xl font-bold bg-gray-100 dark:bg-[#111827] border border-blue-500 rounded-lg px-3 py-1 outline-none text-gray-900 dark:text-white"
                  />
                  <button onClick={handleSaveName} className="text-green-500 hover:text-green-400 transition p-1"><FiCheck /></button>
                  <button onClick={() => setEditName(false)} className="text-red-400 hover:text-red-300 transition p-1"><FiX /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold truncate">{user.fullName || user.username || "Người dùng"}</h1>
                  <button
                    onClick={() => { setNewName(user.fullName || user.username || ""); setEditName(true); }}
                    className="text-gray-400 hover:text-blue-400 transition p-1"
                    title="Chỉnh sửa tên"
                  >
                    <FiEdit2 className="text-sm" />
                  </button>
                </div>
              )}
              {saved && <p className="text-green-500 text-xs mb-1">✓ Đã lưu tên mới!</p>}

              {/* Username */}
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <FiUser className="text-xs" />
                <span>@{user.username || "unknown"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── THÔNG TIN TÀI KHOẢN ─────────────────────────────── */}
        <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Thông tin tài khoản</h2>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800">
              <FiMail className="text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Email</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.email || "Chưa có email"}</p>
              </div>
            </div>

            {/* ID tài khoản */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800">
              <FiUser className="text-violet-500 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">ID tài khoản</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white font-mono">{user.id || "—"}</p>
              </div>
            </div>

            {/* Tài khoản GitHub */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800 group/item relative">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 text-lg">🐱</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Tài khoản GitHub (để map commit)</p>
                  {editGithub ? (
                    <input
                      autoFocus
                      value={newGithub}
                      onChange={(e) => setNewGithub(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveProfile({ githubUsername: newGithub });
                          setEditGithub(false);
                        }
                        if (e.key === "Escape") {
                          setNewGithub(user.githubUsername || "");
                          setEditGithub(false);
                        }
                      }}
                      className="w-full text-sm font-semibold bg-white dark:bg-black border border-blue-500 rounded px-2 py-0.5 outline-none text-gray-900 dark:text-white mt-0.5 focus:ring-1 focus:ring-blue-500"
                      placeholder="Nhập github username..."
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {user.githubUsername || "Chưa thiết lập"}
                    </p>
                  )}
                </div>
              </div>
              
              {editGithub ? (
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => {
                      handleSaveProfile({ githubUsername: newGithub });
                      setEditGithub(false);
                    }}
                    className="text-green-500 hover:text-green-400 font-bold p-1 text-xs transition"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => {
                      setNewGithub(user.githubUsername || "");
                      setEditGithub(false);
                    }}
                    className="text-gray-400 hover:text-red-400 p-1 text-xs transition"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setNewGithub(user.githubUsername || "");
                    setEditGithub(true);
                  }}
                  className="text-gray-400 hover:text-blue-500 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-all opacity-100 md:opacity-0 group-hover/item:opacity-100 ml-2"
                  title="Sửa GitHub Username"
                >
                  <FiEdit2 className="text-xs" />
                </button>
              )}
            </div>

            {/* Vai trò */}
            {(user.role || (user.roles && user.roles.length > 0)) && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800">
                <span className="text-amber-500 flex-shrink-0">👑</span>
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Vai trò</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {user.role === "ADMIN" ? "Quản trị viên" : user.role === "PROJECT_MANAGER" ? "Quản lý dự án" : user.role === "MEMBER" ? "Thành viên" : (user.roles ? user.roles.join(", ") : "Thành viên")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── DỰ ÁN ĐANG THAM GIA ─────────────────────────────── */}
        <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FiFolder /> Dự án đang tham gia ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-4">Chưa có dự án nào</p>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-[#111827] cursor-pointer transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center text-blue-500 text-sm font-bold flex-shrink-0">
                    {(p.name || "P").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate group-hover:text-blue-500 transition-colors">{p.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{p.members?.length || 0} thành viên · {p.tasks?.length || 0} task</p>
                  </div>
                  <span className="text-gray-400 dark:text-gray-600 group-hover:text-blue-400 transition-colors text-sm">→</span>
                </div>
              ))}
              {projects.length > 5 && (
                <button onClick={() => navigate("/")} className="w-full text-center text-xs text-blue-500 hover:text-blue-400 py-2 transition">
                  Xem thêm {projects.length - 5} dự án khác →
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── ĐĂNG XUẤT ────────────────────────────────────────── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition font-semibold text-sm"
        >
          <FiLogOut />
          Đăng xuất
        </button>

      </div>
    </div>
  );
}
