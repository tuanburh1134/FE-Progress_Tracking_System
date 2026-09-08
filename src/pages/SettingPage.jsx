import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSun,
  FiMoon,
  FiLock,
  FiKey,
  FiBell,
  FiGlobe,
  FiShield,
  FiInfo,
  FiCheckCircle,
  FiX,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiUser
} from "react-icons/fi";
import useAuthStore from "../store/authStore";
import { STORAGE_KEYS } from "../constants";

export default function SettingPage() {
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

  // ── THEME STATE ──────────────────────────────────────────────────
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ── NOTIFICATION TOGGLES ──────────────────────────────────────────
  const [emailNotify, setEmailNotify] = useState(
    JSON.parse(localStorage.getItem("setting_email_notify") ?? "true")
  );
  const [taskAssignNotify, setTaskAssignNotify] = useState(
    JSON.parse(localStorage.getItem("setting_task_assign_notify") ?? "true")
  );

  const handleToggleEmail = () => {
    const nextVal = !emailNotify;
    setEmailNotify(nextVal);
    localStorage.setItem("setting_email_notify", JSON.stringify(nextVal));
  };

  const handleToggleTaskAssign = () => {
    const nextVal = !taskAssignNotify;
    setTaskAssignNotify(nextVal);
    localStorage.setItem("setting_task_assign_notify", JSON.stringify(nextVal));
  };

  // ── ĐỔI MẬT KHẨU MODAL STATES ─────────────────────────────────────
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdStep, setPwdStep] = useState(1); // 1: OTP, 2: Passwords
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

  useEffect(() => {
    let timer;
    if (showPwdModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showPwdModal, countdown]);

  // Gửi OTP Đổi mật khẩu
  const handleSendOtp = async () => {
    if (!user?.email) {
      setPwdError("Không tìm thấy địa chỉ email tài khoản.");
      return;
    }
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

  // Xác thực OTP (Bước 1)
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
      setPwdStep(2);
      setPwdSuccess("Xác thực mã OTP thành công! Vui lòng nhập mật khẩu cũ và mật khẩu mới.");
    } catch (err) {
      const msg = err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn.";
      setPwdError(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Đổi mật khẩu (Bước 2)
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070b14] p-6 text-gray-900 dark:text-white">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── HEADER ────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài Đặt Hệ Thống</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý giao diện, bảo mật tài khoản và tùy chọn thông báo của bạn.
          </p>
        </div>

        {/* ── SECTION 1: GIAO DIỆN & CHỦ ĐỀ ────────────────── */}
        <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FiSun className="text-amber-500" /> Giao diện & Chủ đề
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Chế độ Sáng */}
            <div
              onClick={() => setTheme("light")}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                theme === "light"
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold">
                  <FiSun />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Giao diện Sáng</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tone trắng kem hiện đại</p>
                </div>
              </div>
              {theme === "light" && <FiCheckCircle className="text-blue-500 text-lg" />}
            </div>

            {/* Chế độ Tối */}
            <div
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                theme === "dark"
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl font-bold">
                  <FiMoon />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Giao diện Tối</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dịu mắt ban đêm (Dark Mode)</p>
                </div>
              </div>
              {theme === "dark" && <FiCheckCircle className="text-blue-500 text-lg" />}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: BẢO MẬT TÀI KHOẢN ──────────────────── */}
        <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FiShield className="text-blue-500" /> Bảo mật & Xác thực OTP
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center text-xl font-bold">
                  <FiKey />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Đổi mật khẩu tài khoản</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Bảo vệ tài khoản bằng mã OTP 6 chữ số gửi qua Email
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowPwdModal(true);
                  setPwdStep(1);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
              >
                Đổi Mật Khẩu
              </button>
            </div>

            {/* Trạng thái xác thực */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-base shrink-0" />
                <span>Xác thực 2 lớp qua Email OTP đang <strong>Hoạt động</strong></span>
              </div>
              <span className="font-mono text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded font-bold">JWT Enabled</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: THÔNG BÁO HỆ THỐNG ─────────────────── */}
        <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FiBell className="text-purple-500" /> Cài đặt thông báo
          </h2>

          <div className="space-y-4">
            {/* Email Notify */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Thông báo qua Email</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nhận cập nhật tiến độ dự án qua hộp thư</p>
              </div>
              <button
                onClick={handleToggleEmail}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
                  emailNotify ? "bg-blue-600 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            {/* Task Assign Notify */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Thông báo khi được gán Task mới</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nhận thông báo tức thì khi quản lý phân công công việc</p>
              </div>
              <button
                onClick={handleToggleTaskAssign}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
                  taskAssignNotify ? "bg-blue-600 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: THÔNG TIN ỨNG DỤNG ────────────────── */}
        <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FiInfo className="text-cyan-500" /> Thông tin hệ thống
          </h2>

          <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="font-medium">Tên ứng dụng</span>
              <span className="font-semibold text-gray-900 dark:text-white">Project Tracker</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="font-medium">Phiên bản</span>
              <span className="font-mono font-semibold text-blue-500">v1.0.0-SNAPSHOT</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">Môi trường máy chủ</span>
              <span className="font-semibold text-emerald-500">Spring Boot 3 + MySQL + React 19</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── MODAL ĐỔI MẬT KHẨU 2 BƯỚC (OTP) ────────────────────────── */}
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
                      value={user?.email || "—"}
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
