import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/dashboard");
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
          <p className="text-gray-400 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="text-sm text-gray-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@example.com"
              className="w-full mt-1 p-3 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-300">Password</label>
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

            <p className="text-xs text-gray-500 mt-1">
              Demo password: <span className="text-gray-300">demo</span>
            </p>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-lg font-semibold"
          >
            Sign In
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex-1 h-px bg-gray-800"></div>
            Or
            <div className="flex-1 h-px bg-gray-800"></div>
          </div>

          {/* Sign up */}
          <p className="text-center text-sm text-gray-400">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-500">
              Sign up
            </Link>
          </p>
        </form>

        {/* Footer */}
        <div className="mt-6 text-xs text-center text-gray-600 border-t border-gray-800 pt-4">
          Demo Account: any email + password <span className="text-gray-300">demo</span>
        </div>

      </div>
    </div>
  );
}