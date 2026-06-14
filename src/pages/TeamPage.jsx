import { useState } from "react";

const roleColor = {
  Leader: "bg-purple-600",
  PO: "bg-blue-600",
  Dev: "bg-green-600",
};

export default function TeamPage() {
  const [team, setTeam] = useState([
    { id: "1", name: "John Doe", email: "john@example.com", role: "Leader" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Dev" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "Dev" },
    { id: "4", name: "Alice Chen", email: "alice@example.com", role: "PO" },
    { id: "5", name: "David Lee", email: "lee@example.com", role: "Dev" },
  ]);

  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Dev",
  });

  /* ================= ADD / EDIT ================= */
  const handleSubmit = () => {
    if (!form.email.trim()) return;

    if (editId) {
      setTeam((prev) =>
        prev.map((m) =>
          m.id === editId ? { ...m, ...form } : m
        )
      );
    } else {
      setTeam((prev) => [
        ...prev,
        { id: Date.now().toString(), ...form },
      ]);
    }

    setForm({ name: "", email: "", role: "Dev" });
    setEditId(null);
    setOpenForm(false);
  };

  /* ================= EDIT ================= */
  const handleEdit = (member) => {
    setForm(member);
    setEditId(member.id);
    setOpenForm(true);
  };

  /* ================= DELETE ================= */
  const handleDelete = () => {
    setTeam((prev) => prev.filter((m) => m.id !== deleteId));
    setDeleteId(null);
    setOpenDelete(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Nhóm</h1>
          <p className="text-gray-400 text-sm">
            Quản lý thành viên dự án
          </p>
        </div>

        <button
          onClick={() => {
            setForm({ name: "", email: "", role: "Dev" });
            setEditId(null);
            setOpenForm(true);
          }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500"
        >
          + Thêm Thành Viên
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {team.map((m) => (
          <div
            key={m.id}
            className="relative bg-[#0b0f1a] border border-gray-800 rounded-xl p-5 hover:border-blue-500 transition"
          >

            {/* ACTIVE */}
            <div className="absolute top-4 right-4 flex items-center gap-1 text-green-400 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Hoạt động
            </div>

            {/* AVATAR */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold">
                {m.name.charAt(0)}
              </div>

              <div>
                <h2 className="font-semibold">{m.name}</h2>

                <span
                  className={`text-xs px-2 py-1 rounded text-white ${
                    roleColor[m.role]
                  }`}
                >
                  {m.role}
                </span>
              </div>
            </div>

            {/* EMAIL */}
            <div className="text-gray-400 text-sm mb-4">
              {m.email}
            </div>

            <hr className="border-gray-800 mb-4" />

            {/* ACTIONS */}
            <div className="flex gap-3">
              <button
                onClick={() => handleEdit(m)}
                className="flex-1 bg-blue-600/20 text-blue-400 py-2 rounded-lg hover:bg-blue-600/30"
              >
                Chỉnh sửa
              </button>

              <button
                onClick={() => {
                  setDeleteId(m.id);
                  setOpenDelete(true);
                }}
                className="flex-1 bg-red-600/20 text-red-400 py-2 rounded-lg hover:bg-red-600/30"
              >
                Xóa
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* ================= MODAL ADD / EDIT ================= */}
      {openForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

          <div className="bg-[#0b0f1a] p-6 rounded-xl w-[420px] border border-gray-700">

            <h2 className="text-lg font-bold mb-4">
              {editId ? "Chỉnh sửa thành viên" : "Thêm thành viên"}
            </h2>

            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Họ và tên"
              className="w-full p-3 mb-3 rounded bg-black border border-gray-700"
            />

            <input
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="Email"
              className="w-full p-3 mb-3 rounded bg-black border border-gray-700"
            />

            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
              className="w-full p-3 mb-4 rounded bg-black border border-gray-700"
            >
              <option value="Leader">Leader</option>
              <option value="PO">PO</option>
              <option value="Dev">Dev</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpenForm(false)}
                className="text-gray-400"
              >
                Hủy
              </button>

              <button
                onClick={handleSubmit}
                className="bg-blue-600 px-4 py-2 rounded-lg"
              >
                {editId ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ================= DELETE CONFIRM ================= */}
      {openDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

          <div className="bg-[#0b0f1a] p-6 rounded-xl w-[380px] border border-gray-700">

            <h2 className="text-lg font-bold mb-3 text-red-400">
              Xóa Thành Viên
            </h2>

            <p className="text-gray-300 mb-5">
              Bạn có chắc chắn muốn xóa thành viên này không?
            </p>

            <div className="flex justify-end gap-2">

              <button
                onClick={() => setOpenDelete(false)}
                className="text-gray-400"
              >
                Hủy
              </button>

              <button
                onClick={handleDelete}
                className="bg-red-600 px-4 py-2 rounded-lg"
              >
                Xóa
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}