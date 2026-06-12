import { useState } from "react";

export default function ProfilePage() {
  const user = JSON.parse(localStorage.getItem("user")) || {
    fullName: "User",
    email: "user@gmail.com",
  };

  const [name, setName] = useState(user.fullName);
  const [email] = useState(user.email);
  const [msg, setMsg] = useState("");

  const saveProfile = () => {
    const updated = {
      ...user,
      fullName: name,
    };

    localStorage.setItem("user", JSON.stringify(updated));
    setMsg("✅ Cập nhật profile thành công");
  };

  return (
    <div className="text-white max-w-xl">

      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      <div className="bg-[#0b0f1a] border border-gray-800 p-4 rounded space-y-4">

        {/* AVATAR */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>

          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-gray-400 text-sm">{email}</p>
          </div>
        </div>

        {/* NAME EDIT */}
        <div>
          <label className="text-sm text-gray-400">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 p-2 bg-black border border-gray-700 rounded"
          />
        </div>

        {/* EMAIL (read only fake) */}
        <div>
          <label className="text-sm text-gray-400">Email</label>
          <input
            value={email}
            disabled
            className="w-full mt-1 p-2 bg-black border border-gray-700 rounded opacity-60"
          />
        </div>

        <button
          onClick={saveProfile}
          className="px-4 py-2 bg-blue-600 rounded text-white"
        >
          Save Profile
        </button>

        {msg && <p className="text-sm text-gray-300">{msg}</p>}
      </div>
    </div>
  );
}