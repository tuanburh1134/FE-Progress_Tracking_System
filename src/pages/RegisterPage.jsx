import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const user = {
        fullName: name,
        email,
      };

      localStorage.setItem("user", JSON.stringify(user));

      setLoading(false);
      navigate("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      {/* Card (GIỐNG LOGIN 100%) */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#0b0f1a] border border-gray-800 shadow-2xl animate-cardIn">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg">
            PH
          </div>
          <h1 className="text-2xl font-bold mt-3">ProjectHub</h1>
          <p className="text-gray-400 text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="text-sm text-gray-300">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full mt-1 p-3 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>

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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1 p-3 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Button (GIỐNG LOGIN) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-lg font-semibold flex items-center justify-center"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          {/* Link */}
          <p className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500">
              Sign in
            </Link>
          </p>

        </form>

      </div>
    </div>
  );
}