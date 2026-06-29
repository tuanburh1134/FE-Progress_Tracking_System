import { useState, useEffect, useCallback, useRef } from "react";
import { FiX, FiLoader, FiAlertCircle, FiSearch, FiUserPlus, FiUser, FiUsers } from "react-icons/fi";
import ProjectCard from "../components/ProjectCard";
import apiClient from "../services/api";
import { ENDPOINTS } from "../services/endpoints";
import useAuthStore from "../store/authStore";
import memberService from "../features/projects/services/memberService";
import teamService from "../features/projects/services/teamService";
import { useNavigate } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";

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
   Avatar chữ cái đầu
──────────────────────────────────────────────── */
function Avatar({ name, size = "sm" }) {
  const colors = [
    "bg-blue-600", "bg-purple-600", "bg-green-600",
    "bg-orange-500", "bg-pink-600", "bg-teal-600",
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const dim = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${dim} ${color} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODAL TẠO DỰ ÁN
──────────────────────────────────────────────── */
function CreateProjectModal({onClose,onCreate,onUpdate,project,}) {
  const user = useAuthStore((s) => s.user);

const [form, setForm] = useState({
  name: project?.name || "",
  projectCode: project?.projectCode || "",
  description: project?.description || "",
  sdlc: project?.sdlc || "AGILE",
  priority: project?.priority || "MEDIUM",
  startDate:
    project?.startDate ||
    new Date().toISOString().split("T")[0],
  deadline: project?.deadline || "",
});

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  /* ── Mời thành viên ── */
  const [emailQuery,      setEmailQuery]      = useState("");
  const [searchResults,   setSearchResults]   = useState([]);
  const [searchLoading,   setSearchLoading]   = useState(false);
  const [invitedMembers,  setInvitedMembers]  = useState([]);
  const [showDropdown,    setShowDropdown]    = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teamsLoading, setTeamsLoading] = useState(false);

  useEffect(() => {
    const fetchMyTeams = async () => {
      setTeamsLoading(true);
      try {
        const teamsList = await teamService.getMyTeams();
        setMyTeams(teamsList);
      } catch (err) {
        console.error("Error loading teams:", err);
      } finally {
        setTeamsLoading(false);
      }
    };
    fetchMyTeams();
  }, []);

  /* Debounce search */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (emailQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await memberService.searchUsers(emailQuery);
        // Lọc những người đã được mời rồi
        const filtered = results.filter(
          (u) => !invitedMembers.some((inv) => inv.id === u.id)
        );
        setSearchResults(filtered);
        setShowDropdown(filtered.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [emailQuery, invitedMembers]);

  /* Đóng dropdown khi click ra ngoài */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInvite = (member) => {
    setInvitedMembers((prev) => [...prev, member]);
    setEmailQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleRemoveInvited = (memberId) => {
    setInvitedMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  /* Submit tạo dự án */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    console.log("Form state:", form);

    const trimmedName = form.name.trim();
    const trimmedProjectCode = form.projectCode.trim();
    const trimmedDescription = form.description.trim();

    if (!trimmedName) {
      setError("Tên dự án không được để trống.");
      console.log("Validation failed: name is empty");
      return;
    }

    if (trimmedName.length < 3 || trimmedName.length > 200) {
      setError("Tên dự án phải từ 3-200 ký tự.");
      console.log("Validation failed: name length invalid", trimmedName.length);
      return;
    }

    if (trimmedProjectCode.length > 50) {
      setError("Mã dự án không được vượt quá 50 ký tự.");
      console.log("Validation failed: projectCode too long", trimmedProjectCode.length);
      return;
    }

    if (trimmedDescription.length > 5000) {
      setError("Mô tả không được vượt quá 5000 ký tự.");
      console.log("Validation failed: description too long", trimmedDescription.length);
      return;
    }

    if (!form.deadline) {
      setError("Vui lòng chọn ngày kết thúc.");
      console.log("Validation failed: deadline is empty");
      return;
    }
    if (form.deadline <= form.startDate) {
      setError("Ngày kết thúc phải sau ngày bắt đầu.");
      console.log("Validation failed: deadline <= startDate");
      return;
    }

    console.log("Validation passed, calling API...");
    setLoading(true);
    try {
      const payload = {
        name:        trimmedName,
        projectCode: trimmedProjectCode || null,
        description: trimmedDescription || null,
        priority:    form.priority,
        sdlc: form.sdlc,
        startDate:   form.startDate,
        deadline:    form.deadline,
      };

      // console.log("Payload:", payload);
      // const res = await apiClient.post(ENDPOINTS.PROJECTS.CREATE, payload);
      // console.log("API response:", res);
      // const created = res.data?.data;

      console.log("Payload:", payload);

      let res;
      let savedProject;

      if (project) {
          // Cập nhật
          res = await apiClient.put(
              ENDPOINTS.PROJECTS.UPDATE(project.id),
              payload
          );

          savedProject = res.data?.data;

      } else {
          // Tạo mới
          res = await apiClient.post(
              ENDPOINTS.PROJECTS.CREATE,
              payload
          );

          savedProject = res.data?.data;
      }

      console.log("API response:", res);

      const backendError =
          res.data?.success === false ? res.data?.message : null;

      if (backendError) {
          throw new Error(backendError);
      }
      
      // const backendError = res.data?.success === false ? res.data?.message : null;
      // if (backendError) {
      //   throw new Error(backendError);
      // }
      
      /* Thêm thành viên từ nhóm nếu chọn nhóm */
      if (selectedTeamId && savedProject?.id) {
        await teamService.addMembersFromTeamToProject(savedProject.id, Number(selectedTeamId));
      }

      /* Mời từng thành viên theo email sau khi tạo project thành công */
      if (!project && invitedMembers.length > 0 && savedProject?.id) {
        await Promise.allSettled(
          invitedMembers.map((m) =>
            memberService.addMember(savedProject.id, m.email)
          )
        );

        /* ── Ghi lời mời pending vào localStorage (invitee thấy trong Hòm thư) ── */
        const existingInvites = JSON.parse(localStorage.getItem("invitations") || "[]");
        const newInvites = invitedMembers.map((m) => ({
          id: `invite-${savedProject.id}-${m.id || m.email}-${Date.now()}`,
          projectName: savedProject.name || form.name.trim(),
          inviterName: user?.fullName || user?.username || "Trưởng nhóm",
          inviterId:   user?.id,
          inviteeEmail: m.email,
          inviteeId:   m.id,
          role: "Thành viên",
          status: "pending",
          createdAt: Date.now(),
          projectData: {
            id:          savedProject.id,
            name:        savedProject.name || form.name.trim(),
            description: payload.description,
            priority:    payload.priority,
            startDate:   payload.startDate,
            deadline:    payload.deadline,
            members: [
              {
                id:    user?.id,
                name:  user?.fullName || user?.username,
                email: user?.email,
              },
            ],
          },
        }));
        localStorage.setItem("invitations", JSON.stringify([...existingInvites, ...newInvites]));

        // Phát sự kiện để Header cập nhật badge ngay lập tức
        window.dispatchEvent(new CustomEvent("storage-update"));
      }

    if (project) {
        onUpdate(savedProject);
    } else {
        onCreate(savedProject);
    }

    onClose();
    } catch (err) {
      console.error("Error creating project:", err);
      console.error("Error details:", err.response?.data);

      const responseData = err.response?.data;
      const validationErrors = responseData?.data;
      const backendMessage = responseData?.message;

      if (validationErrors && typeof validationErrors === 'object') {
        const firstError = Object.values(validationErrors)[0];
        setError(firstError || backendMessage || "Tạo dự án thất bại. Vui lòng thử lại.");
      } else {
        setError(backendMessage || err.message || "Tạo dự án thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-xl shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-[#0b0f1a] z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {project ? "Sửa Dự Án" : "Tạo Dự Án Mới"}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {project
    ? "Chỉnh sửa thông tin dự án"
    : "Điền thông tin bên dưới để khởi tạo dự án"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition"
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
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">
                  Tên Dự Án <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Nhập tên dự án..."
                  className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-600"
                />
              </div>

              {/* Mã dự án */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">
                  Mã Dự Án
                </label>
                <input
                  value={form.projectCode}
                  onChange={(e) => set("projectCode", e.target.value)}
                  placeholder="Nhập mã dự án (ví dụ: ABC-123)"
                  className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-600"
                />
              </div>

              {/* Mô hình SDLC */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">
                  Mô hình SDLC
                </label>
                <select
                  value={form.sdlc}
                  onChange={(e) => set("sdlc", e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white"
                >
                  {SDLC_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Mô tả */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">
                  Mô Tả
                  <span className="text-gray-500 text-xs ml-1">(tóm tắt mục tiêu, phạm vi)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Mô tả ngắn về dự án..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white resize-none placeholder:text-gray-500 dark:placeholder:text-gray-600"
                />
              </div>
            </div>
          </section>

          {/* ── TIMELINE & ƯU TIÊN ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              Timeline & Ưu Tiên
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Ngày bắt đầu */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">
                  Ngày Bắt Đầu <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white cursor-pointer"
                />
              </div>

              {/* Ngày kết thúc */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">
                  Ngày Kết Thúc <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  min={form.startDate}
                  onChange={(e) => set("deadline", e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white cursor-pointer"
                />
              </div>

              {/* Ưu tiên */}
              <div className="col-span-2">
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">Độ Ưu Tiên</label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set("priority", p.value)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
                        form.priority === p.value
                          ? "border-blue-500 bg-blue-600/20 text-gray-900 dark:text-white"
                          : "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-black text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                    >
                      <span className={p.color}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── MỜI THÀNH VIÊN ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FiUserPlus className="text-blue-400" />
              Mời Thành Viên
              <span className="text-gray-500 dark:text-gray-600 font-normal normal-case">(tuỳ chọn)</span>
            </h3>

            {/* Chọn Nhóm (Thêm toàn bộ thành viên của nhóm) */}
            <div className="mb-4">
              <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">
                Chọn nhóm thành viên
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white"
                disabled={teamsLoading}
              >
                <option value="">-- Không chọn nhóm --</option>
                {myTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.memberCount} thành viên)
                  </option>
                ))}
              </select>
              {selectedTeamId && (
                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                  <FiUsers className="text-xs" />
                  <span>Toàn bộ thành viên của nhóm này sẽ tự động được thêm vào dự án khi tạo/cập nhật.</span>
                </p>
              )}
            </div>

            {/* Search input */}
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 text-sm" />
                <input
                  value={emailQuery}
                  onChange={(e) => setEmailQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Nhập email để tìm kiếm thành viên..."
                  className="w-full pl-9 pr-4 p-2.5 rounded-lg bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-600"
                />
                {searchLoading && (
                  <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
                )}
              </div>

              {/* Dropdown kết quả */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#0f1422] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition cursor-pointer border-b border-gray-200 dark:border-gray-800 last:border-0"
                    >
                      <Avatar name={u.fullName || u.username} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {u.fullName || u.username}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{u.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInvite(u)}
                        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
                      >
                        <FiUserPlus className="text-xs" />
                        Mời
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Danh sách đã mời */}
            {invitedMembers.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-500">
                  Đã chọn {invitedMembers.length} thành viên:
                </p>
                {invitedMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/30 rounded-lg"
                  >
                    <Avatar name={m.fullName || m.username} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {m.fullName || m.username}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{m.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInvited(m.id)}
                      className="text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition p-1 rounded"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── NGƯỜI TẠO ── */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Trưởng nhóm (bạn)</p>
              <p className="text-sm text-gray-900 dark:text-white font-medium">{user?.fullName || user?.username}</p>
            </div>
          </div>

          {/* Nút submit */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
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
                  {project ? "Đang cập nhật..." : "Đang tạo..."}
                </>
              ) : (
                <>
                  {project ? "Cập nhật Dự Án" : "Tạo Dự Án"}
                  {invitedMembers.length > 0 && (
                    <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                      +{invitedMembers.length}
                    </span>
                  )}
                </>
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
  const [editingProject, setEditingProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);
  const navigate = useNavigate();

  /* Xoá dự án */
  const handleDelete = async () => {

      if (!deleteProject) return;

      try {

          await apiClient.delete(
              ENDPOINTS.PROJECTS.DELETE(deleteProject.id)
          );

          setProjects(prev =>
              prev.filter(p => p.id !== deleteProject.id)
          );

          setDeleteProject(null);

      } catch (err) {

          console.error(err);

          alert("Xóa dự án thất bại.");

      }
  };

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
  /* Callback khi cập nhật thành công */
  const handleUpdated = (updatedProject) => {
        setProjects((prev) =>
            prev.map((p) =>
                p.id === updatedProject.id
                    ? updatedProject
                    : p
            )
        );
    };

  /* Lọc theo tìm kiếm */
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#070a12] text-gray-900 dark:text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dự Án</h1>
          {!loading && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
              {projects.length} dự án của bạn
            </p>
          )}
        </div>

  <div className="flex gap-3">

    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Tìm kiếm dự án..."
      className="bg-gray-100 dark:bg-[#0b0f1a] border border-gray-300 dark:border-gray-800 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 w-52 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
    />

    <button
      onClick={() => navigate("/projects/trash")}
      className="flex items-center gap-2 border border-red-500 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition"
    >
      <FiTrash2 size={18} />
      <span>Thùng rác</span>
    </button>

    <button
      onClick={() => {
        setEditingProject(null);
        setIsOpen(true);
      }}
      className="bg-blue-600 hover:bg-blue-500 transition px-4 py-2 rounded-lg text-sm font-semibold text-white"
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
              <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => {
                      setEditingProject(project);
                      setIsOpen(true);
                  }}
                  onDelete={() => setDeleteProject(project)}
              />
            ))}
          </div>

          {/* EMPTY STATE */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-500 dark:text-gray-500 gap-3">
              {search ? (
                <p>Không tìm thấy dự án nào khớp với "<span className="text-gray-900 dark:text-white">{search}</span>"</p>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-400">Chưa có dự án nào</p>
                  <p className="text-sm">Bấm "+ Thêm Dự Án" để tạo dự án đầu tiên của bạn</p>
                  <button
                    onClick={() => {
                        setEditingProject(null);
                        setIsOpen(true);
                    }}
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
              project={editingProject}
              onClose={() => {
                  setIsOpen(false);
                  setEditingProject(null);
              }}
              onCreate={handleCreated}
              onUpdate={handleUpdated}
          />
      )}
      {/* MODAL XÓA DỰ ÁN */}
        {deleteProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

                <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-700 shadow-2xl">

                    <div className="p-6">

                        <div className="flex justify-center mb-4">

                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">

                                <svg
                                    className="w-8 h-8 text-red-500"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
                                    />
                                </svg>

                            </div>

                        </div>

                        <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">

                            Xóa dự án

                        </h2>

                        <p className="mt-3 text-center text-gray-600 dark:text-gray-400">

                            Bạn có chắc muốn xóa

                            <br />

                            <span className="font-semibold text-red-500">

                                "{deleteProject.name}"

                            </span>

                            ?

                        </p>

                        <p className="text-center text-sm mt-2 text-gray-500">

                            Dự án sẽ được chuyển vào Thùng rác và có thể khôi phục sau.

                        </p>

                        <div className="flex gap-3 mt-8">

                            <button
                                onClick={() => setDeleteProject(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            >
                                Hủy
                            </button>

                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition"
                            >
                                Xóa dự án
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        )}      
    </div>
  );
}

