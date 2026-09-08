import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiLoader,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiMail,
  FiShield,
  FiClock,
  FiUserCheck,
  FiPlus,
  FiBriefcase
} from "react-icons/fi";
import teamService from "../features/auth/services/teamService";
import useAuthStore from "../store/authStore";

/* ─────────────────────────────────────────────
   Avatar Helper Component
──────────────────────────────────────────────── */
function Avatar({ name, size = "md" }) {
  const colors = [
    "bg-blue-600",
    "bg-purple-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-pink-600",
    "bg-indigo-600",
  ];
  const charCode = name?.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  const dimMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base font-bold",
  };

  return (
    <div
      className={`${dimMap[size] || dimMap.md} ${color} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 shadow-sm`}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODAL TẠO NHÓM MỚI (Tên + Mời qua Email autocomplete)
──────────────────────────────────────────────── */
function CreateTeamModal({ onClose, onSuccess }) {
  const currentUser = useAuthStore((s) => s.user);

  const [teamName, setTeamName] = useState("");
  const [emailQuery, setEmailQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  /* Debounce search email người dùng trong Database */
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
        const results = await teamService.searchUsersByEmail(emailQuery);
        // Lọc người dùng đã được chọn mời
        const filtered = results.filter(
          (u) => !invitedMembers.some((inv) => inv.id === u.id)
        );
        setSearchResults(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (err) {
        console.error("Lỗi tìm kiếm user:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

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

  const handleSelectUser = (user) => {
    setInvitedMembers((prev) => [...prev, user]);
    setEmailQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleRemoveInvited = (userId) => {
    setInvitedMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = teamName.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên nhóm.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Tạo nhóm mới
      const newTeam = await teamService.createTeam(trimmedName);

      // 2. Gom danh sách email cần mời (từ invitedMembers + emailQuery nếu có)
      const emailsToInvite = [...invitedMembers.map((m) => m.email)];
      if (emailQuery.trim() && !emailsToInvite.includes(emailQuery.trim())) {
        emailsToInvite.push(emailQuery.trim());
      }

      if (emailsToInvite.length > 0 && newTeam?.id) {
        for (const targetEmail of emailsToInvite) {
          try {
            await teamService.inviteMember(newTeam.id, targetEmail);
          } catch (invErr) {
            console.error(`Lỗi mời ${targetEmail}:`, invErr);
            const msg =
              invErr.response?.data?.message ||
              `Không thể gửi lời mời tới email ${targetEmail}`;
            throw new Error(msg);
          }
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Lỗi tạo nhóm:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Không thể tạo nhóm. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0b0f1a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500">
              <FiUsers className="text-lg" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Tạo Nhóm Mới
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tạo nhóm làm việc và mời các thành viên tham gia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs">
              <FiAlertCircle className="flex-shrink-0 text-base" />
              {error}
            </div>
          )}

          {/* Tên nhóm */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Tên nhóm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nhập tên nhóm (ví dụ: Team Backend, Thiết Kế UI/UX...)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 transition"
              autoFocus
            />
          </div>

          {/* Ô mời thành viên (Email Autocomplete) */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Mời thành viên qua Email
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={emailQuery}
                onChange={(e) => setEmailQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Nhập email tài khoản trong hệ thống..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 transition"
              />
              {searchLoading && (
                <FiLoader className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin text-sm" />
              )}
            </div>

            {/* Dropdown danh sách kết quả tìm thấy trong Database */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto">
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition cursor-pointer border-b border-gray-100 dark:border-gray-800/60 last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <Avatar name={u.fullName || u.username} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {u.fullName || u.username}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
                    >
                      <FiUserPlus className="text-xs" />
                      Mời
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danh sách người được chọn mời */}
          {invitedMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thành viên sẽ nhận được lời mời ({invitedMembers.length}):
              </p>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {invitedMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={m.fullName || m.username} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {m.fullName || m.username}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {m.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInvited(m.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition"
                    >
                      <FiX className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trưởng nhóm info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-800">
            <Avatar name={currentUser?.fullName || currentUser?.username} size="sm" />
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                {currentUser?.fullName || currentUser?.username}{" "}
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded">
                  Leader (Bạn)
                </span>
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {currentUser?.email}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition"
            >
              {submitting ? (
                <>
                  <FiLoader className="animate-spin text-sm" />
                  Đang tạo...
                </>
              ) : (
                <>
                  Tạo Nhóm
                  {invitedMembers.length > 0 && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                      +{invitedMembers.length} lời mời
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
   MODAL MỜI THÊM THÀNH VIÊN VÀO NHÓM ĐÃ CÓ
──────────────────────────────────────────────── */
function InviteMemberModal({ team, onClose, onSuccess }) {
  const [emailQuery, setEmailQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const debounceRef = useRef(null);

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
        const results = await teamService.searchUsersByEmail(emailQuery);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        console.error("Lỗi tìm user:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [emailQuery]);

  const handleSendInvite = async (userToInvite) => {
    setError("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      await teamService.inviteMember(team.id, userToInvite.email);
      setSuccessMsg(`Đã gửi lời mời tới ${userToInvite.email}`);
      setEmailQuery("");
      setSelectedUser(null);
      setShowDropdown(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Không thể gửi lời mời.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Mời Thành Viên - {team.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-xs">
            {successMsg}
          </div>
        )}

        <div className="relative">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Nhập email thành viên
          </label>
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              placeholder="Tìm kiếm theo email..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-800 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            {searchLoading && (
              <FiLoader className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin text-sm" />
            )}
          </div>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-600/10 cursor-pointer border-b border-gray-100 dark:border-gray-800/60 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Avatar name={u.fullName || u.username} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {u.fullName || u.username}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSendInvite(u)}
                    className="flex-shrink-0 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
                  >
                    Mời
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODAL CHI TIẾT THÀNH VIÊN TRONG NHÓM
──────────────────────────────────────────────── */
function TeamDetailModal({ team, onClose, onRefresh }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teamService.getTeamMembers(team.id);
      setMembers(data);
    } catch (err) {
      console.error("Lỗi tải thành viên nhóm:", err);
    } finally {
      setLoading(false);
    }
  }, [team.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const isOwner = currentUser?.id === team.ownerId;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0b0f1a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-500">
              <FiUsers className="text-xl" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {team.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Trưởng nhóm: {team.ownerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow transition"
              >
                <FiUserPlus />
                Mời thêm
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <FiLoader className="animate-spin text-blue-500 text-2xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Leader section */}
              <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={team.ownerName} size="md" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {team.ownerName}
                      <span className="text-[10px] bg-purple-600 text-white font-semibold px-2 py-0.5 rounded-full">
                        Trưởng nhóm
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Chủ sở hữu nhóm
                    </p>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Danh sách thành viên ({members.length})
                </h4>

                {members.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-3 text-center">
                    Chưa có thành viên nào khác trong nhóm.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <Avatar name={m.userName} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {m.userName}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {m.userEmail}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {m.status === "ACCEPTED" ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
                              <FiCheck className="text-xs" /> Đã tham gia
                            </span>
                          ) : m.status === "PENDING" ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                              <FiClock className="text-xs" /> Đang chờ xác nhận
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">
                              Đã từ chối
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showInviteModal && (
        <InviteMemberModal
          team={team}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            fetchMembers();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN TEAM PAGE
──────────────────────────────────────────────── */
export default function TeamPage() {
  const [teams, setTeams] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const currentUser = useAuthStore((s) => s.user);

  /* Tải tất cả dữ liệu nhóm và lời mời */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsData, pendingData] = await Promise.all([
        teamService.getMyTeams(),
        teamService.getPendingInvitations(),
      ]);
      setTeams(teamsData);
      setPendingInvitations(pendingData);
    } catch (err) {
      console.error("Lỗi tải thông tin Nhóm:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Xử lý Chấp nhận lời mời */
  const handleAcceptInvite = async (invitationId) => {
    setActionLoading(invitationId);
    try {
      await teamService.acceptInvitation(invitationId);
      await fetchData();
    } catch (err) {
      console.error("Lỗi chấp nhận lời mời:", err);
      alert(err.response?.data?.message || "Lỗi chấp nhận lời mời.");
    } finally {
      setActionLoading(null);
    }
  };

  /* Xử lý Từ chối lời mời */
  const handleDeclineInvite = async (invitationId) => {
    setActionLoading(invitationId);
    try {
      await teamService.declineInvitation(invitationId);
      await fetchData();
    } catch (err) {
      console.error("Lỗi từ chối lời mời:", err);
      alert(err.response?.data?.message || "Lỗi từ chối lời mời.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white p-6 space-y-8">
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <FiUsers className="text-blue-500" />
            Nhóm Làm Việc
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Quản lý danh sách các nhóm và mời thành viên qua Email
          </p>
        </div>

        <button
          onClick={() => setOpenCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition transform active:scale-95"
        >
          <FiPlus className="text-base" />
          + Tạo Nhóm Mới
        </button>
      </div>

      {/* LỜI MỜI THAM GIA NHÓM ĐANG CHỜ XÁC NHẬN (PENDING INVITATIONS) */}
      {pendingInvitations.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <FiMail className="text-base animate-bounce" />
            Lời Mời Tham Gia Nhóm Đang Chờ Bạn Xác Nhận ({pendingInvitations.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-white dark:bg-[#0f172a] border border-amber-500/20 rounded-xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <Avatar name={inv.teamName} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {inv.teamName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Người mời:{" "}
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {inv.inviterName}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptInvite(inv.id)}
                    disabled={actionLoading === inv.id}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    {actionLoading === inv.id ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      <>
                        <FiCheck /> Chấp nhận
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.id)}
                    disabled={actionLoading === inv.id}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DANH SÁCH CÁC NHÓM CỦA TÔI (MY TEAMS) */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <FiBriefcase className="text-blue-500" />
          Danh Sách Nhóm ({teams.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FiLoader className="animate-spin text-blue-500 text-3xl" />
          </div>
        ) : teams.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800/80 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto text-2xl">
              <FiUsers />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Chưa có nhóm làm việc nào
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tạo nhóm mới và nhập email để mời các đồng nghiệp gia nhập nhóm ngay.
              </p>
            </div>
            <button
              onClick={() => setOpenCreateModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition"
            >
              <FiPlus /> Tạo Nhóm Đầu Tiên
            </button>
          </div>
        ) : (
          /* GRID CÁC CẶP CARD NHÓM */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((t) => {
              const isOwner = currentUser?.id === t.ownerId;
              return (
                <div
                  key={t.id}
                  className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-blue-500/50 hover:shadow-lg transition space-y-4 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.name} size="md" />
                        <div>
                          <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                            {t.name}
                          </h3>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            Trưởng nhóm:{" "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {t.ownerName}
                            </span>
                          </p>
                        </div>
                      </div>

                      {isOwner && (
                        <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-full border border-purple-500/20">
                          Leader
                        </span>
                      )}
                    </div>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* Info bar */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3">
                      <span className="flex items-center gap-1.5">
                        <FiUserCheck className="text-blue-500" /> Thành viên:
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {t.memberCount + 1} người
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedTeam(t)}
                      className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <FiUsers /> Xem danh sách thành viên
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL TẠO NHÓM */}
      {openCreateModal && (
        <CreateTeamModal
          onClose={() => setOpenCreateModal(false)}
          onSuccess={fetchData}
        />
      )}

      {/* MODAL CHI TIẾT NHÓM */}
      {selectedTeam && (
        <TeamDetailModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
