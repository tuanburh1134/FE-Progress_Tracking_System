import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../services/api";
import { ENDPOINTS } from "../services/endpoints";
import { STORAGE_KEYS } from "../constants";
import useAuthStore from "../store/authStore";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.REGISTER, {
        fullName,
        username,
        email,
        password,
      });
      const { accessToken, user } = res.data.data;

      // Lưu token vào localStorage để api.ts interceptor đọc được
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

      // Lưu vào Zustand store
      setAuth(user, accessToken);

      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Đăng ký thất bại. Email hoặc tên đăng nhập đã được sử dụng.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      {/* Card */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#0b0f1a] border border-gray-800 shadow-2xl animate-cardIn">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg">
            PH
          </div>
          <h1 className="text-2xl font-bold mt-3">ProjectHub</h1>
          <p className="text-gray-400 text-sm">Tạo tài khoản mới</p>
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Họ và tên */}
          <div>
            <label className="text-sm text-gray-300">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full mt-1 p-3 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Tên đăng nhập */}
          <div>
            <label className="text-sm text-gray-300">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nguyenvana"
              className="w-full mt-1 p-3 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm text-gray-300">Địa chỉ Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full mt-1 p-3 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="text-sm text-gray-300">Mật khẩu</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 p-3 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-4 text-gray-400"
              >
                {show ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 6 ký tự</p>
          </div>

          {/* Nút đăng ký */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-lg font-semibold flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Đang tạo tài khoản...
              </span>
            ) : (
              "Tạo Tài Khoản"
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex-1 h-px bg-gray-800"></div>
            Hoặc
            <div className="flex-1 h-px bg-gray-800"></div>
          </div>

          {/* Link đăng nhập */}
          <p className="text-center text-sm text-gray-400">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-blue-500 hover:text-blue-400">
              Đăng nhập
            </Link>
          </p>

        </form>

      </div>
    </div>
  );
}