import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiEdit2,
  FiCheck,
  FiX,
  FiLogOut,
  FiFolder,
  FiKey,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiLock,
  FiArrowLeft
} from "react-icons/fi";
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

  const [user, setUser] = useState(getUser);
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState("");
  const [projects, setProjects] = useState([]);
  const [saved, setSaved] = useState(false);

  const [editGithub, setEditGithub] = useState(false);
  const [newGithub, setNewGithub] = useState("");

  // ── Đổi mật khẩu modal states ──────────────────────────────────────
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdStep, setPwdStep] = useState(1); // 1: Xác thực OTP, 2: Nhập mật khẩu cũ/mới
  const [otpCode, setOtpCode] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [countdown, setCountdown] = useState(60);

  // Đếm ngược gửi lại OTP
  useEffect(() => {
    let timer;
    if (showPwdModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showPwdModal, countdown]);

  const loadProfile = useCallback(async () => {
    try {
      const { default: apiClient } = await import("../services/api");
      const res = await apiClient.get("/users/profile");
      const uData = res.data?.data;
      if (uData) {
        setUser(uData);
        setNewName(uData.fullName || uData.username || "");
        setNewGithub(uData.githubUsername || "");
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

  // ── Đổi mật khẩu: Gửi OTP qua Email ─────────────────────────────
  const handleSendOtp = async () => {
    setPwdError("");
    setPwdSuccess("");
    setSendingOtp(true);
    try {
      const { default: apiClient } = await import("../services/api");
      await apiClient.post("/auth/send-otp", {
        email: user.email,
        type: "CHANGE_PASSWORD",
      });
      setPwdSuccess(`Mã OTP đã được gửi về email ${user.email}. Vui lòng kiểm tra hộp thư!`);
      setCountdown(60);
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể gửi mã OTP. Vui lòng thử lại sau.";
      setPwdError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Đổi mật khẩu Bước 1: Xác nhận mã OTP ─────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setPwdError("Vui lòng nhập đúng 6 chữ số mã OTP.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const { default: apiClient } = await import("../services/api");
      await apiClient.post("/users/verify-otp", {
        email: user.email,
        otpCode: otpCode.trim(),
      });

      // Xác thực OTP thành công -> Chuyển sang Bước 2 (Nhập mật khẩu)
      setPwdStep(2);
      setPwdSuccess("Xác thực mã OTP thành công! Vui lòng nhập mật khẩu cũ và mật khẩu mới.");
    } catch (err) {
      const msg = err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn.";
      setPwdError(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Đổi mật khẩu Bước 2: Nhập Mật khẩu cũ & Mật khẩu mới ──────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!oldPassword.trim()) {
      setPwdError("Vui lòng nhập mật khẩu cũ.");
      return;
    }
    if (newPassword.length < 8) {
      setPwdError("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPwdError("Mật khẩu mới phải chứa ít nhất 1 chữ cái in hoa (A-Z).");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPwdError("Mật khẩu mới phải chứa ít nhất 1 chữ số (0-9).");
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      setPwdError("Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt (VD: !@#$%...).");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError("Mật khẩu mới và Nhập lại mật khẩu không trùng khớp.");
      return;
    }

    setSavingPwd(true);
    try {
      const { default: apiClient } = await import("../services/api");
      await apiClient.post("/users/change-password", {
        otpCode: otpCode.trim(),
        oldPassword,
        newPassword,
      });

      setPwdSuccess("🎉 Đổi mật khẩu thành công! Hãy dùng mật khẩu mới cho lần đăng nhập sau.");
      setTimeout(() => {
        resetPwdModal();
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.";
      setPwdError(msg);
    } finally {
      setSavingPwd(false);
    }
  };

  const resetPwdModal = () => {
    setShowPwdModal(false);
    setPwdStep(1);
    setOtpCode("");
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPwdError("");
    setPwdSuccess("");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#070b14]">
        <p className="text-gray-500 dark:text-gray-400">
          Chưa đăng nhập. <a href="/login" className="text-blue-500 underline">Đăng nhập</a>
        </p>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setEditName(false);
                    }}
                    className="flex-1 text-xl font-bold bg-gray-100 dark:bg-[#111827] border border-blue-500 rounded-lg px-3 py-1 outline-none text-gray-900 dark:text-white"
                  />
                  <button onClick={handleSaveName} className="text-green-500 hover:text-green-400 transition p-1">
                    <FiCheck />
                  </button>
                  <button onClick={() => setEditName(false)} className="text-red-400 hover:text-red-300 transition p-1">
                    <FiX />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold truncate">{user.fullName || user.username || "Người dùng"}</h1>
                  <button
                    onClick={() => {
                      setNewName(user.fullName || user.username || "");
                      setEditName(true);
                    }}
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
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Thông tin tài khoản
          </h2>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800">
              <FiMail className="text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                  Email
                </p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {user.email || "Chưa có email"}
                </p>
              </div>
            </div>

            {/* ID tài khoản */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800">
              <FiUser className="text-violet-500 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                  ID tài khoản
                </p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white font-mono">
                  {user.id || "—"}
                </p>
              </div>
            </div>

            {/* Tài khoản GitHub (ĐÃ BỎ CỤM "ĐỂ MAP COMMIT") */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800 group/item relative">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 text-lg">🐱</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                    Tài khoản GitHub
                  </p>
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
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                    Vai trò
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {user.role === "ADMIN"
                      ? "Quản trị viên"
                      : user.role === "PROJECT_MANAGER"
                      ? "Quản lý dự án"
                      : user.role === "MEMBER"
                      ? "Thành viên"
                      : user.roles
                      ? user.roles.join(", ")
                      : "Thành viên"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── BẢO MẬT & ĐỔI MẬT KHẨU ─────────────────────────── */}
        <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FiLock /> Bảo mật tài khoản
          </h2>

          <button
            onClick={() => {
              setShowPwdModal(true);
              setPwdStep(1);
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 bg-gray-50/50 dark:bg-[#111827]/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold">
                <FiKey />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-blue-500 transition">
                  Đổi mật khẩu
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Xác thực mã OTP qua Email trước khi cập nhật mật khẩu mới
                </p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-blue-500 transition">→</span>
          </button>
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

      {/* ── MODAL ĐỔI MẬT KHẨU 2 BƯỚC ────────────────────────────── */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <FiKey className="text-blue-500 text-xl" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {pwdStep === 1 ? "Xác thực OTP (Bước 1)" : "Đổi mật khẩu (Bước 2)"}
                </h3>
              </div>
              <button
                onClick={resetPwdModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Error & Success Messages */}
            {pwdError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs leading-relaxed">
                {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
                <FiCheckCircle className="mt-0.5 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {/* BƯỚC 1: XÁC THỰC MÃ OTP */}
            {pwdStep === 1 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Email nhận mã OTP
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      disabled
                      value={user.email}
                      className="flex-1 p-2.5 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      disabled={sendingOtp || countdown > 0}
                      onClick={handleSendOtp}
                      className="px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition shrink-0"
                    >
                      {sendingOtp
                        ? "Đang gửi..."
                        : countdown > 0
                        ? `Gửi lại (${countdown}s)`
                        : "Gửi mã OTP"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Mã OTP 6 chữ số
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full text-center text-xl font-bold tracking-[6px] mt-1 p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border-2 border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-blue-600 dark:text-blue-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || !otpCode.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold text-sm transition disabled:opacity-60"
                >
                  {verifyingOtp ? "Đang xác thực OTP..." : "Xác nhận mã OTP"}
                </button>
              </form>
            )}

            {/* BƯỚC 2: NHẬP MẬT KHẨU CŨ & MẬT KHẨU MỚI (CHỈ HIỆN KHI OTP XÁC THỰC THÀNH CÔNG) */}
            {pwdStep === 2 && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Mật khẩu cũ */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Mật khẩu hiện tại (Mật khẩu cũ)
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showOld ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full p-3 rounded-lg bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOld(!showOld)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showOld ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Mật khẩu mới
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full p-3 rounded-lg bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Tối thiểu 8 ký tự, bao gồm chữ in hoa, chữ số và ký tự đặc biệt
                  </p>
                </div>

                {/* Nhập lại mật khẩu mới */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Nhập lại mật khẩu mới
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showConfirmNew ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full p-3 rounded-lg bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNew(!showConfirmNew)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmNew ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPwdStep(1)}
                    className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1"
                  >
                    <FiArrowLeft /> Quay lại
                  </button>

                  <button
                    type="submit"
                    disabled={savingPwd}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold text-sm transition disabled:opacity-60"
                  >
                    {savingPwd ? "Đang lưu..." : "Lưu Mật Khẩu Mới"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
