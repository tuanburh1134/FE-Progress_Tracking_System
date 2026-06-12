import { useNavigate } from "react-router-dom";

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="bg-[#0b0f1a] border border-gray-800 rounded-xl p-4 hover:border-blue-500 transition cursor-pointer"
    >
      <h2 className="text-lg font-bold text-white mb-1">
        {project.name}
      </h2>

      <p className="text-sm text-gray-400 mb-3">
        {project.status}
      </p>

      <div className="w-full h-2 bg-gray-800 rounded mb-3">
        <div
          className="h-2 bg-blue-500 rounded"
          style={{ width: `${project.progress}%` }}
        />
      </div>

      {/* 🔥 3 CỘT: TASK - MEMBER - DATE */}
      <div className="flex text-xs text-gray-400">
        <div className="w-1/3 text-left">
          {project.tasks?.length || 0} tasks
        </div>

        <div className="w-1/3 text-center">
          {project.members} members
        </div>

        <div className="w-1/3 text-right text-gray-500">
          {project.createdAt}
        </div>
      </div>
    </div>
  );
}