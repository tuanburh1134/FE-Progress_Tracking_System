import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const STATUS_COLORS = {
  PLANNING:    "text-yellow-400 bg-yellow-400/10",
  IN_PROGRESS: "text-blue-400 bg-blue-400/10",
  ON_HOLD:     "text-orange-400 bg-orange-400/10",
  COMPLETED:   "text-green-400 bg-green-400/10",
  CANCELLED:   "text-red-400 bg-red-400/10",
};

const PRIORITY_COLORS = {
  LOW:      "text-slate-400",
  MEDIUM:   "text-blue-400",
  HIGH:     "text-orange-400",
  CRITICAL: "text-red-400",
};

export default function ProjectCard({project, onEdit, onDelete,}) {
  const navigate = useNavigate();

  const statusColor = STATUS_COLORS[project.status] || "text-gray-400 bg-gray-400/10";
  const priorityColor = PRIORITY_COLORS[project.priority] || "text-gray-400";

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

      {/* Status badge */}
      <div className="mb-3">
        <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
          {project.statusLabel || project.status}
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

