import { useState, useEffect, useCallback, useRef } from "react";
import { FiX, FiLoader, FiAlertCircle, FiSearch, FiUserPlus, FiUsers, FiTrash2, FiInfo, FiUserCheck } from "react-icons/fi";
import teamService from "../features/projects/services/teamService";
import memberService from "../features/projects/services/memberService";
import useAuthStore from "../store/authStore";

function Avatar({ name, size = "sm" }) {
  const colors = [
    "bg-blue-600", "bg-purple-600", "bg-green-600",
    "bg-orange-500", "bg-pink-600", "bg-teal-600",
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-11 h-11 text-base";
  return (
    <div className={`${dim} ${color} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md`}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

export default function TeamPage() {
  const currentUser = useAuthStore((s) => s.user);
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  // Mời thành viên theo email
  const [emailQuery, setEmailQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  /* ================= FETCH TEAMS ================= */
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await teamService.getMyTeams();
      setTeams(data);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách nhóm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  /* ================= CREATE TEAM ================= */
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setCreateLoading(true);
    setCreateError("");
    try {
      const newTeam = await teamService.createTeam(
        createForm.name.trim(),
        createForm.description.trim()
      );
      setTeams((prev) => [newTeam, ...prev]);
      setCreateForm({ name: "", description: "" });
      setOpenCreate(false);
    } catch (err) {
      console.error(err);
      setCreateError(err.response?.data?.message || "Tạo nhóm thất bại.");
    } finally {
      setCreateLoading(false);
    }
  };

  /* ================= DETAILED TEAM ================= */
  const handleViewDetail = async (team) => {
    setSelectedTeam(team);
    setDetailLoading(true);
    setDetailError("");
    try {
      const fullTeam = await teamService.getTeamDetail(team.id);
      setSelectedTeam(fullTeam);
    } catch (err) {
      console.error(err);
      setDetailError("Không thể tải chi tiết nhóm.");
    } finally {
      setDetailLoading(false);
    }
  };

  /* ================= SEARCH USER DEBOUNCE ================= */
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
        // Lọc những người đã là thành viên trong nhóm này hoặc là chủ sở hữu
        const currentMembers = selectedTeam?.members || [];
        const ownerId = selectedTeam?.owner?.id;
        
        const filtered = results.filter(
          (u) => 
            u.id !== ownerId &&
            !currentMembers.some((m) => m.id === u.id)
        );
        setSearchResults(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [emailQuery, selectedTeam]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= ADD MEMBER ================= */
  const handleAddMember = async (user) => {
    if (!selectedTeam) return;
    try {
      await teamService.addMember(selectedTeam.id, user.email);
      // Refresh details
      const updatedTeam = await teamService.getTeamDetail(selectedTeam.id);
      setSelectedTeam(updatedTeam);
      
      // Cập nhật số thành viên ở danh sách ngoài trang chủ
      setTeams((prev) =>
        prev.map((t) =>
          t.id === selectedTeam.id ? { ...t, memberCount: updatedTeam.members.length } : t
        )
      );

      setEmailQuery("");
      setSearchResults([]);
      setShowDropdown(false);
    } catch (err) {
      alert(err.response?.data?.message || "Không thể thêm thành viên.");
    }
  };

  /* ================= REMOVE MEMBER ================= */
  const handleRemoveMember = async (memberId) => {
    if (!selectedTeam) return;
    if (!window.confirm("Bạn có chắc muốn xóa thành viên này khỏi nhóm không?")) return;

    try {
      await teamService.removeMember(selectedTeam.id, memberId);
      const updatedTeam = await teamService.getTeamDetail(selectedTeam.id);
      setSelectedTeam(updatedTeam);

      // Cập nhật số thành viên ở danh sách ngoài trang chủ
      setTeams((prev) =>
        prev.map((t) =>
          t.id === selectedTeam.id ? { ...t, memberCount: updatedTeam.members.length } : t
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa thành viên.");
    }
  };

  /* ================= DELETE TEAM ================= */
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      await teamService.deleteTeam(teamToDelete.id);
      setTeams((prev) => prev.filter((t) => t.id !== teamToDelete.id));
      setOpenDeleteConfirm(false);
      setTeamToDelete(null);
      if (selectedTeam?.id === teamToDelete.id) {
        setSelectedTeam(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Xóa nhóm thất bại.");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#070a12] text-gray-900 dark:text-white p-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Nhóm của tôi</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Tạo nhóm làm việc để phân phối và phân công dự án nhanh chóng.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateForm({ name: "", description: "" });
            setCreateError("");
            setOpenCreate(true);
          }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-lg transition"
        >
          <span>+ Tạo Nhóm Mới</span>
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mb-6">
          <FiAlertCircle className="text-xl flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-3 text-gray-400">
          <FiLoader className="animate-spin text-3xl text-blue-500" />
          <span className="text-sm">Đang tải danh sách nhóm...</span>
        </div>
      ) : (
        <>
          {/* TEAMS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((t) => {
              const isOwner = currentUser?.id === t.owner?.id;
              return (
                <div
                  key={t.id}
                  className="relative bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-500 transition shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${isOwner ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'bg-green-600/10 text-green-400 border border-green-500/20'}`}>
                      {isOwner ? "Trưởng nhóm" : "Thành viên"}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <FiUsers />
                      <span>{t.memberCount ?? 0} thành viên</span>
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5 truncate">
                    {t.name}
                  </h2>

                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 h-10 mb-4">
                    {t.description || "Không có mô tả cho nhóm này."}
                  </p>

                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    Tạo bởi: <span className="font-semibold text-gray-700 dark:text-gray-300">{t.owner?.fullName || t.owner?.username}</span>
                  </div>

                  <hr className="border-gray-200 dark:border-gray-800 mb-4" />

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewDetail(t)}
                      className="flex-1 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white py-2 rounded-lg text-sm font-semibold transition text-center"
                    >
                      Xem chi tiết
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => {
                          setTeamToDelete(t);
                          setOpenDeleteConfirm(true);
                        }}
                        className="p-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition"
                        title="Xóa nhóm"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* EMPTY STATE */}
          {teams.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-500 gap-3">
              <FiUsers className="text-5xl text-gray-300 dark:text-gray-700" />
              <p className="text-lg font-medium text-gray-400">Chưa có nhóm nào</p>
              <p className="text-sm text-gray-400 -mt-2">Bấm nút tạo nhóm để bắt đầu quản lý làm việc nhóm</p>
              <button
                onClick={() => setOpenCreate(true)}
                className="mt-2 bg-blue-600 hover:bg-blue-500 transition px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-md"
              >
                Tạo nhóm đầu tiên
              </button>
            </div>
          )}
        </>
      )}

      {/* ================= MODAL TẠO NHÓM ================= */}
      {openCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0b0f1a] p-6 rounded-xl w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Tạo Nhóm Làm Việc Mới
              </h2>
              <button onClick={() => setOpenCreate(false)} className="text-gray-500 hover:text-white">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg flex items-center gap-2">
                  <FiAlertCircle />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Tên nhóm <span className="text-red-500">*</span>
                </label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Nhập tên nhóm làm việc..."
                  className="w-full p-2.5 rounded bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-600 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả nhóm
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Nhập mô tả ngắn..."
                  rows={3}
                  className="w-full p-2.5 rounded bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-600 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenCreate(false)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-blue-600 hover:bg-blue-500 transition px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-md disabled:opacity-60 flex items-center gap-1"
                >
                  {createLoading && <FiLoader className="animate-spin" />}
                  Tạo Nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CHI TIẾT NHÓM ================= */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white dark:bg-[#0b0f1a] rounded-xl w-full max-w-lg border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-start p-5 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedTeam.name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {selectedTeam.description || "Không có mô tả."}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedTeam(null);
                  setEmailQuery("");
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-1 rounded"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Thêm thành viên (chỉ dành cho Owner) */}
              {currentUser?.id === selectedTeam.owner?.id && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Thêm thành viên vào nhóm
                  </h3>
                  
                  {/* Search input with dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                      <input
                        value={emailQuery}
                        onChange={(e) => setEmailQuery(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                        placeholder="Nhập email để tìm kiếm thành viên..."
                        className="w-full pl-9 pr-4 p-2.5 rounded bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-600 outline-none focus:border-blue-500 text-sm"
                      />
                      {searchLoading && (
                        <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#0f1422] border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden max-h-52 overflow-y-auto">
                        {searchResults.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition cursor-pointer border-b border-gray-200 dark:border-gray-800 last:border-0"
                            onClick={() => handleAddMember(u)}
                          >
                            <Avatar name={u.fullName || u.username} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {u.fullName || u.username}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                            </div>
                            <button
                              type="button"
                              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition"
                            >
                              <FiUserPlus />
                              Thêm
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div>
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Thành viên nhóm ({selectedTeam.members?.length + 1 || 1})
                </h3>

                {detailLoading ? (
                  <div className="flex items-center justify-center p-6 text-gray-500">
                    <FiLoader className="animate-spin mr-2" />
                    <span>Đang tải thông tin thành viên...</span>
                  </div>
                ) : detailError ? (
                  <p className="text-sm text-red-400">{detailError}</p>
                ) : (
                  <div className="space-y-3">
                    {/* Owner Row */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-900">
                      <div className="flex items-center gap-3">
                        <Avatar name={selectedTeam.owner?.fullName || selectedTeam.owner?.username} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {selectedTeam.owner?.fullName || selectedTeam.owner?.username}
                          </p>
                          <p className="text-xs text-gray-500">{selectedTeam.owner?.email}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold">
                        Trưởng nhóm (Chủ sở hữu)
                      </span>
                    </div>

                    {/* Member Rows */}
                    {selectedTeam.members?.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-[#121826]/30 hover:bg-gray-50 dark:hover:bg-[#121826]/50 rounded-lg border border-gray-100 dark:border-gray-800/80 transition"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={m.fullName || m.username} />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {m.fullName || m.username}
                            </p>
                            <p className="text-xs text-gray-500">{m.email}</p>
                          </div>
                        </div>

                        {currentUser?.id === selectedTeam.owner?.id && (
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded transition"
                            title="Xóa thành viên"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => {
                  setSelectedTeam(null);
                  setEmailQuery("");
                  setSearchResults([]);
                }}
                className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-850 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 transition"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN XÓA NHÓM ================= */}
      {openDeleteConfirm && teamToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0b0f1a] p-6 rounded-xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl">
            <h2 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-3">
              <FiTrash2 />
              <span>Xóa Nhóm Làm Việc</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Bạn có chắc chắn muốn xóa nhóm <strong>{teamToDelete.name}</strong> không? Hành động này không thể khôi phục.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setOpenDeleteConfirm(false);
                  setTeamToDelete(null);
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm transition"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteTeam}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-md"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
