import { useState, useEffect, useCallback } from "react";
import { FiX, FiLoader, FiAlertCircle } from "react-icons/fi";
import ProjectCard from "../components/ProjectCard";
import apiClient from "../services/api";
import { ENDPOINTS } from "../services/endpoints";
import useAuthStore from "../store/authStore";

/* ─────────────────────────────────────────────
   Hằng số lựa chọn
──────────────────────────────────────────────── */
const PRIORITY_OPTIONS = [
  { value: "LOW",      label: "Thấp",       color: "text-slate-400" },
  { value: "MEDIUM",   label: "Trung bình", color: "text-blue-400" },
  { value: "HIGH",     label: "Cao",        color: "text-orange-400" },
  { value: "CRITICAL", label: "Khẩn cấp",  color: "text-red-400" },
];

const SDLC_OPTIONS = [
  { value: "AGILE",     label: "Agile (Scrum)" },
  { value: "WATERFALL", label: "Waterfall" },
  { value: "KANBAN",    label: "Kanban" },
];

/* ─────────────────────────────────────────────
   MODAL TẠO DỰ ÁN
──────────────────────────────────────────────── */
function CreateProjectModal({ onClose, onCreate }) {
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    name:        "",
    description: "",
    sdlc:        "AGILE",
    priority:    "MEDIUM",
    startDate:   new Date().toISOString().split("T")[0],
    deadline:    "",
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Tên dự án không được để trống.");
      return;
    }
    if (!form.deadline) {
      setError("Vui lòng chọn ngày kết thúc.");
      return;
    }
    if (form.deadline <= form.startDate) {
      setError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim() || null,
        priority:    form.priority,
        startDate:   form.startDate,
        deadline:    form.deadline,
      };

      const res = await apiClient.post(ENDPOINTS.PROJECTS.CREATE, payload);
      const created = res.data?.data;
      onCreate(created);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo dự án thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0b0f1a] border border-gray-700 rounded-2xl w-full max-w-xl shadow-2xl animate-fadeIn">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">Tạo Dự Án Mới</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Điền thông tin bên dưới để khởi tạo dự án
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl p-1 rounded hover:bg-gray-800 transition"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Lỗi */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <FiAlertCircle className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── THÔNG TIN CƠ BẢN ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Thông Tin Cơ Bản
            </h3>

            <div className="space-y-3">
              {/* Tên dự án */}
              <div>
                <label className="text-sm text-gray-300 block mb-1">
                  Tên Dự Án <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Nhập tên dự án..."
                  className="w-full p-2.5 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none text-sm text-white placeholder-gray-600"
                />
              </div>

              {/* Mô hình SDLC */}
              <div>
                <label className="text-sm text-gray-300 block mb-1">Mô Hình SDLC</label>
                <select
                  value={form.sdlc}
                  onChange={(e) => set("sdlc", e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none text-sm text-white"
                >
                  {SDLC_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Mô tả */}
              <div>
                <label className="text-sm text-gray-300 block mb-1">
                  Mô Tả
                  <span className="text-gray-500 text-xs ml-1">(tóm tắt mục tiêu, phạm vi)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Mô tả ngắn về dự án..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none text-sm text-white placeholder-gray-600 resize-none"
                />
              </div>
            </div>
          </section>

          {/* ── TIMELINE & ƯU TIÊN ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Timeline & Ưu Tiên
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Ngày bắt đầu */}
              <div>
                <label className="text-sm text-gray-300 block mb-1">
                  Ngày Bắt Đầu <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none text-sm text-white cursor-pointer"
                />
              </div>

              {/* Ngày kết thúc — chọn lịch */}
              <div>
                <label className="text-sm text-gray-300 block mb-1">
                  Ngày Kết Thúc <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  min={form.startDate}
                  onChange={(e) => set("deadline", e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full p-2.5 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none text-sm text-white cursor-pointer"
                />
              </div>

              {/* Ưu tiên */}
              <div className="col-span-2">
                <label className="text-sm text-gray-300 block mb-2">Độ Ưu Tiên</label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set("priority", p.value)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
                        form.priority === p.value
                          ? "border-blue-500 bg-blue-600/20 text-white"
                          : "border-gray-700 bg-black text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      <span className={p.color}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── NGƯỜI TẠO ── */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-xs text-gray-400">Trưởng nhóm (bạn)</p>
              <p className="text-sm text-white font-medium">{user?.fullName || user?.username}</p>
            </div>
          </div>

          {/* Nút submit */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo Dự Án"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TRANG DỰ ÁN CHÍNH
──────────────────────────────────────────────── */
export default function ProjectPage() {
  const [projects,  setProjects]  = useState([]);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [isOpen,    setIsOpen]    = useState(false);

  /* Fetch danh sách dự án từ API */
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(ENDPOINTS.PROJECTS.LIST, {
        params: { page: 0, size: 50 },
      });
      const content = res.data?.data?.content || [];
      setProjects(content);
    } catch (err) {
      console.error("Lỗi tải dự án:", err);
      setError("Không thể tải danh sách dự án. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /* Callback khi tạo thành công */
  const handleCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  /* Lọc theo tìm kiếm */
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070a12] text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dự Án</h1>
          {!loading && (
            <p className="text-gray-400 text-sm mt-0.5">
              {projects.length} dự án của bạn
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm dự án..."
            className="bg-[#0b0f1a] border border-gray-800 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 w-52"
          />

          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 transition px-4 py-2 rounded-lg text-sm font-semibold"
          >
            + Thêm Dự Án
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center mt-20 gap-3 text-gray-400">
          <FiLoader className="animate-spin text-3xl text-blue-500" />
          <span className="text-sm">Đang tải dự án...</span>
        </div>
      )}

      {/* LỖI */}
      {!loading && error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mt-4">
          <FiAlertCircle className="text-xl flex-shrink-0" />
          <div>
            <p className="font-medium">{error}</p>
            <button
              onClick={fetchProjects}
              className="text-sm text-red-300 hover:text-white underline mt-1"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* GRID DỰ ÁN */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* EMPTY STATE */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-500 gap-3">
              {search ? (
                <p>Không tìm thấy dự án nào khớp với "<span className="text-white">{search}</span>"</p>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-400">Chưa có dự án nào</p>
                  <p className="text-sm">Bấm "+ Thêm Dự Án" để tạo dự án đầu tiên của bạn</p>
                  <button
                    onClick={() => setIsOpen(true)}
                    className="mt-2 bg-blue-600 hover:bg-blue-500 transition px-5 py-2 rounded-lg text-sm text-white"
                  >
                    Tạo dự án ngay
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL */}
      {isOpen && (
        <CreateProjectModal
          onClose={() => setIsOpen(false)}
          onCreate={handleCreated}
        />
      )}
    </div>
  );
}