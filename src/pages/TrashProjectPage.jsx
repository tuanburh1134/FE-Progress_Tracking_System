import { useEffect, useState } from "react";
import { FiLoader, FiAlertCircle } from "react-icons/fi";
import apiClient from "../services/api";
import { ENDPOINTS } from "../services/endpoints";
import {
  FiRefreshCcw,
  FiTrash2,
  FiUsers,
  FiCheckSquare,
  FiCalendar,
} from "react-icons/fi";

export default function TrashProjectPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [restoreProject, setRestoreProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);

  const loadTrash = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await apiClient.get(
        ENDPOINTS.PROJECTS.TRASH
      );

      setProjects(res.data.data.content || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải thùng rác.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

    const handleRestore = async () => {
    if (!restoreProject) return;

    try {
        await apiClient.put(
        ENDPOINTS.PROJECTS.RESTORE(restoreProject.id)
        );

        setProjects((prev) =>
        prev.filter((p) => p.id !== restoreProject.id)
        );

        setRestoreProject(null);
    } catch (err) {
        console.error(err);
        alert("Khôi phục thất bại.");
    }
    };

    const handleDeleteForever = async () => {
    if (!deleteProject) return;

    try {
        await apiClient.delete(
        ENDPOINTS.PROJECTS.PERMANENT_DELETE(deleteProject.id)
        );

        setProjects((prev) =>
        prev.filter((p) => p.id !== deleteProject.id)
        );

        setDeleteProject(null);
    } catch (err) {
        console.error(err);
        alert("Xóa thất bại.");
    }
    };

  return (
    <div className="min-h-screen bg-white dark:bg-[#070a12] text-gray-900 dark:text-white p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          🗑 Thùng rác
        </h1>

        {!loading && (
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {projects.length} dự án đã xóa
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center mt-20 gap-3 text-gray-400">
          <FiLoader className="animate-spin text-3xl text-red-500" />
          <span>Đang tải...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30">
          <FiAlertCircle className="text-red-500 text-xl" />

          <div>
            <p>{error}</p>

            <button
              onClick={loadTrash}
              className="underline mt-2 text-red-500"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* LIST */}
      {!loading && !error && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((project) => (
            <div
            key={project.id}
            className="bg-white dark:bg-[#0b0f1a]
                        border border-gray-200 dark:border-gray-800
                        rounded-xl p-4
                        hover:border-red-500
                        hover:shadow-lg
                        transition-all duration-300"
            >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {project.name}
                    </h2>

                    {project.projectCode && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                        {project.projectCode}
                    </span>
                    )}

                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                    Đã xóa
                    </span>
                </div>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {project.description || "Không có mô tả"}
                </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                {/* Khôi phục */}
                <button
                    onClick={() => setRestoreProject(project)}
                    className="w-10 h-10 rounded-lg
                            bg-green-100 dark:bg-green-500/10
                            text-green-600 dark:text-green-400
                            hover:bg-green-600 hover:text-white
                            transition"
                    title="Khôi phục"
                >
                    <FiRefreshCcw className="mx-auto" size={18} />
                </button>

                {/* Xóa vĩnh viễn */}
                <button
                    onClick={() => setDeleteProject(project)}
                    className="w-10 h-10 rounded-lg
                            bg-red-100 dark:bg-red-500/10
                            text-red-600 dark:text-red-400
                            hover:bg-red-600 hover:text-white
                            transition"
                    title="Xóa vĩnh viễn"
                >
                    <FiTrash2 className="mx-auto" size={18} />
                </button>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-800">

                <div className="flex items-center gap-1 w-1/3">
                <FiCheckSquare />
                <span>{project.taskCount ?? 0} nhiệm vụ</span>
                </div>

                <div className="flex items-center justify-center gap-1 w-1/3">
                <FiUsers />
                <span>{project.memberCount ?? 0} thành viên</span>
                </div>

                <div className="flex items-center justify-end gap-1 w-1/3">
                <FiCalendar />
                <span>
                    {project.deadline
                    ? new Date(project.deadline).toLocaleDateString("vi-VN")
                    : "--"}
                </span>
                </div>

            </div>
            </div>
        ))}
        </div>

          {projects.length === 0 && (
            <div className="mt-20 flex flex-col items-center text-gray-500 gap-3">
              <div className="text-6xl">🗑</div>

              <h2 className="text-xl font-semibold">
                Thùng rác trống
              </h2>

              <p>
                Không có dự án nào đang nằm trong thùng rác.
              </p>
            </div>
          )}
        {restoreProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-700 shadow-2xl">

            <div className="p-6">

                <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-3xl">
                    ♻
                </div>
                </div>

                <h2 className="text-xl font-bold text-center">
                Khôi phục dự án
                </h2>

                <p className="mt-4 text-center text-gray-500">
                Bạn có chắc muốn khôi phục
                <br />
                <span className="font-semibold text-green-500">
                    "{restoreProject.name}"
                </span>
                ?
                </p>

                <div className="flex gap-3 mt-8">

                <button
                    onClick={() => setRestoreProject(null)}
                    className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-gray-700"
                >
                    Hủy
                </button>

                <button
                    onClick={handleRestore}
                    className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white"
                >
                    Khôi phục
                </button>

                </div>

            </div>

            </div>
        </div>
        )}  
        {deleteProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-700 shadow-2xl">

            <div className="p-6">

                <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-3xl">
                    🗑
                </div>
                </div>

                <h2 className="text-xl font-bold text-center">
                Xóa vĩnh viễn
                </h2>

                <p className="mt-4 text-center text-gray-500">
                Bạn có chắc muốn xóa
                <br />
                <span className="font-semibold text-red-500">
                    "{deleteProject.name}"
                </span>
                ?
                </p>

                <p className="text-center text-sm text-red-500 mt-2">
                Hành động này không thể hoàn tác.
                </p>

                <div className="flex gap-3 mt-8">

                <button
                    onClick={() => setDeleteProject(null)}
                    className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-gray-700"
                >
                    Hủy
                </button>

                <button
                    onClick={handleDeleteForever}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white"
                >
                    Xóa vĩnh viễn
                </button>

                </div>

            </div>

            </div>

        </div>
        )}          
        </>
      )}
    </div> 
  );    
}