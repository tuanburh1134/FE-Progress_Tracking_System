import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import useAuthStore from "../store/authStore";

const ROLE_CONFIG = {
  OWNER: { label: "Trưởng nhóm", color: "text-amber-700 bg-amber-100 border border-amber-300 font-semibold dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50" },
  MANAGER: { label: "Quản lý", color: "text-purple-700 bg-purple-100 border border-purple-300 font-semibold dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50" },
  MEMBER: { label: "Thành viên", color: "text-blue-700 bg-blue-100 border border-blue-300 font-medium dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50" },
  VIEWER: { label: "Người xem", color: "text-gray-600 bg-gray-100 border border-gray-300 font-medium dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700" },
};

const PRIORITY_COLORS = {
  LOW:      "text-slate-400",
  MEDIUM:   "text-blue-400",
  HIGH:     "text-orange-400",
  CRITICAL: "text-red-400",
};

export default function ProjectCard({project, onEdit, onDelete,}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  let roleKey = project.myRole || "MEMBER";

  if (user) {
    if (project.ownerId && Number(project.ownerId) === Number(user.id)) {
      roleKey = "OWNER";
    } else if (project.ownerName && (user.fullName === project.ownerName || user.username === project.ownerName)) {
      roleKey = "OWNER";
    } else {
      try {
        const elevated = JSON.parse(localStorage.getItem(`elevated_managers_${project.id}`) || "[]");
        if (elevated.some((m) => m === user.id || m === user.username || m === user.fullName)) {
          roleKey = "MANAGER";
        }
      } catch (e) {}
    }
  }

  const roleInfo = ROLE_CONFIG[roleKey] || ROLE_CONFIG.MEMBER;

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-blue-500 transition cursor-pointer group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition line-clamp-1">
              {project.name}
          </h2>

          <div className="flex items-center gap-2">

              {project.projectCode && (
                  <span className="text-xs text-gray-600 dark:text-gray-500 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {project.projectCode}
                  </span>
              )}

              {/* Sửa */}
              <button
                  onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                  }}
                  className="p-1.5 rounded-lg hover:bg-blue-500 hover:text-white transition"
                  title="Sửa"
              >
                  <FiEdit2 size={16} />
              </button>

              {/* Xóa */}
              <button
                  onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-500 hover:text-white transition"
                  title="Xóa"
              >
                  <FiTrash2 size={16} />
              </button>

          </div>
      </div>

      {/* Role badge (Chức vụ của bản thân trong nhóm) */}
      <div className="mb-3">
        <span className={`text-xs px-2.5 py-1 rounded-full ${roleInfo.color}`}>
          {roleInfo.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-800 rounded-full mb-3">
        <div
          className="h-1.5 bg-blue-500 rounded-full transition-all"
          style={{ width: `${project.progress || 0}%` }}
        />
      </div>

      {/* Footer: nhiệm vụ - thành viên - ngày */}
      <div className="flex text-xs text-gray-600 dark:text-gray-400 items-center">
        <div className="flex items-center gap-1 w-1/3">
          <span>{project.taskCount ?? 0} nhiệm vụ</span>
        </div>

        <div className="flex items-center gap-1 w-1/3 justify-center">
          <span>{project.memberCount ?? 0} thành viên</span>
        </div>

        <div className="w-1/3 text-right text-gray-500 dark:text-gray-500">
          {project.startDate
            ? new Date(project.startDate).toLocaleDateString("vi-VN")
            : "—"}
        </div>
      </div>
    </div>
  );
}


