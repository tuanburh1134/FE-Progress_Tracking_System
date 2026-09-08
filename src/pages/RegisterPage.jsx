import { useState, useEffect, useRef } from "react";
import { FiEye, FiEyeOff, FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../services/api";
import { ENDPOINTS } from "../services/endpoints";
import { STORAGE_KEYS } from "../constants";
import useAuthStore from "../store/authStore";

export default function RegisterPage() {
  const [step, setStep] = useState(1); // Step 1: Nhập thông tin, Step 2: Nhập OTP
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(60);

  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const googleBtnRef = useRef(null);

  // Xử lý Google Sign-In Callback
  const handleGoogleCallback = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.GOOGLE, { idToken: response.credential });
      const { accessToken, user } = res.data.data;

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      setAuth(user, accessToken);
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Đăng ký / Đăng nhập bằng Google thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 1) return;
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "428410865361-8ineoe6c60cfrbtuaq1ofkd1gljitn65.apps.googleusercontent.com";

    const initGoogleBtn = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCallback,
          });
          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            width: "380",
            text: "signup_with",
            shape: "rectangular",
            logo_alignment: "left",
            locale: "vi",
          });
        } catch (e) {
          console.error("Lỗi khởi tạo Google Auth:", e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleBtn();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogleBtn();
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Đếm ngược 60 giây khi gửi OTP
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Validation Form thông tin đăng ký
  const validateForm = () => {
    if (
      !fullName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Vui lòng điền đầy đủ tất cả các trường.");
      return false;
    }
    if (username.trim().length < 3 || username.trim().length > 50) {
      setError("Tên đăng nhập phải từ 3 đến 50 ký tự.");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError(
        "Tên đăng nhập chỉ được chứa chữ không dấu (a-z, A-Z), số (0-9) và dấu gạch dưới (_)."
      );
      return false;
    }
    // Mật khẩu phải có từ 8 ký tự trở lên
    if (password.length < 8) {
      setError("Mật khẩu phải có tối thiểu 8 ký tự.");
      return false;
    }
    // Mật khẩu phải chứa chữ in hoa
    if (!/[A-Z]/.test(password)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ cái in hoa (A-Z).");
      return false;
    }
    // Mật khẩu phải chứa chữ số
    if (!/[0-9]/.test(password)) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ số (0-9).");
      return false;
    }
    // Mật khẩu phải chứa ký tự đặc biệt
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError(
        "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (VD: !@#$%^&*...)."
      );
      return false;
    }
    // Kiểm tra khớp mật khẩu
    if (password !== confirmPassword) {
      setError("Mật khẩu và Nhập lại mật khẩu không trùng khớp.");
      return false;
    }
    return true;
  };

  // Bước 1: Kiểm tra & Yêu cầu gửi mã OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!validateForm()) return;

    setSendingOtp(true);
    try {
      await apiClient.post(ENDPOINTS.AUTH.SEND_OTP, {
        email: email.trim(),
        type: "REGISTER",
      });

      setSuccessMsg(`Mã OTP đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư!`);
      setStep(2);
      setCountdown(60);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Không thể gửi mã OTP. Vui lòng kiểm tra lại địa chỉ email.";
      setError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Bước 2: Xác nhận OTP & Hoàn tất Đăng ký
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Vui lòng nhập đúng 6 chữ số mã OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.REGISTER, {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        otpCode: otpCode.trim(),
      });
      const { accessToken, user } = res.data.data;

      // Lưu token vào localStorage & Zustand
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      setAuth(user, accessToken);

      navigate("/dashboard");
    } catch (err) {
      const fieldErrors = err.response?.data?.data;
      if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
        const fieldNames = {
          username: "Tên đăng nhập",
          email: "Email",
          password: "Mật khẩu",
          fullName: "Họ và tên",
          otpCode: "Mã OTP",
        };
        const errorLines = Object.entries(fieldErrors)
          .map(([field, msg]) => `• ${fieldNames[field] || field}: ${msg}`)
          .join("\n");
        setError(errorLines);
      } else {
        const msg =
          err.response?.data?.message ||
          "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-background p-4 text-gray-900 dark:text-white relative overflow-hidden">
      {/* Sparkle decorative icon ở góc dưới bên phải */}
      <div className="absolute bottom-10 right-14 opacity-40 text-blue-400 dark:text-blue-300 text-2xl select-none pointer-events-none animate-pulse">
        ✦
      </div>
      <div className="absolute bottom-16 right-24 opacity-20 text-sky-300 text-lg select-none pointer-events-none">
        ✦
      </div>

      {/* Card */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/80 dark:bg-[#0b0f1a]/85 backdrop-blur-xl border border-white/70 dark:border-gray-800/70 shadow-2xl animate-cardIn relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white mb-2 shadow-lg shadow-blue-500/30">
            PH
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ProjectHub</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {step === 1 ? "Tạo tài khoản mới" : "Xác nhận mã OTP qua Email"}
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm whitespace-pre-line leading-relaxed">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-2">
            <FiCheckCircle className="mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* BƯỚC 1: NHẬP THÔNG TIN CÁ NHÂN */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Họ và tên */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
                className="w-full mt-1 p-3 rounded-lg border outline-none transition-all duration-200 
                          bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 
                          focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                          dark:bg-black dark:border-gray-700 dark:text-white dark:placeholder-gray-500 
                          dark:focus:border-blue-500"
              />
            </div>

            {/* Tên đăng nhập */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: nguyen_van_a123"
                required
                className="w-full mt-1 p-3 rounded-lg bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Chữ không dấu, số và dấu _ (không chứa khoảng trắng)
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Địa chỉ Email thực
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="w-full mt-1 p-3 rounded-lg bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full mt-1 p-3 rounded-lg bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none pr-10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {show ? <FiEye /> : <FiEyeOff />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tối thiểu 8 ký tự, bao gồm chữ in hoa, chữ số và ký tự đặc biệt
              </p>
            </div>

            {/* Nhập lại mật khẩu */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full mt-1 p-3 rounded-lg bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none pr-10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showConfirm ? <FiEye /> : <FiEyeOff />}
                </button>
              </div>
            </div>

            {/* Nút Đăng ký */}
            <button
              type="submit"
              disabled={sendingOtp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all p-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 text-base"
            >
              {sendingOtp ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Đang xử lý đăng ký...
                </>
              ) : (
                "Đăng ký"
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2 text-gray-500 text-sm my-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
              Hoặc đăng ký nhanh với
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
            </div>

            {/* Nút Google Sign-In */}
            <div className="flex justify-center w-full min-h-[44px]">
              <div ref={googleBtnRef} className="w-full flex justify-center"></div>
            </div>

            {/* Link đăng nhập */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 pt-1">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-blue-500 font-medium hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        )}

        {/* BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2 text-center">
                Nhập mã xác thực OTP (6 chữ số)
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                autoFocus
                required
                className="w-full text-center text-2xl font-bold tracking-[8px] p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border-2 border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none text-blue-600 dark:text-blue-400 placeholder:text-gray-300 dark:placeholder:text-gray-700"
              />
              <p className="text-xs text-center text-gray-500 mt-2">
                Mã OTP có hiệu lực trong 5 phút. Vui lòng kiểm tra kỹ cả thư mục Spams/Rác.
              </p>
            </div>

            {/* Nút hoàn tất đăng ký */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all p-3.5 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 text-base"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Đang xác thực & Tạo tài khoản...
                </>
              ) : (
                "Xác Nhận & Hoàn Tất Đăng Ký"
              )}
            </button>

            {/* Resend & Back buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
              >
                <FiArrowLeft /> Quay lại sửa thông tin
              </button>

              <button
                type="button"
                disabled={countdown > 0 || sendingOtp}
                onClick={handleSendOtp}
                className="text-blue-500 hover:underline font-medium disabled:opacity-50 disabled:no-underline"
              >
                {countdown > 0 ? `Gửi lại OTP (${countdown}s)` : "Gửi lại mã OTP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
