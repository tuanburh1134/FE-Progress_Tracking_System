import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProjectPage({ projectList, setProjectList }) {
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("projects")) || [];
    setProjectList(data);
  }, []);

  return (
    <div className="text-white">

      {/* TITLE */}
      <h1 className="text-2xl font-bold mb-6">Dự Án</h1>

      {/* GRID PROJECTS */}
      <div className="grid grid-cols-2 gap-6">

        {projectList.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/project/${p.id}`)}
            className="
              bg-[#0b0f1a]
              border border-gray-800
              rounded-xl
              p-5
              cursor-pointer
              hover:border-blue-500
              transition
            "
          >

            {/* PROJECT NAME */}
            <h2 className="text-lg font-semibold mb-2">
              {p.name}
            </h2>

            {/* SMALL INFO */}
            <div className="text-sm text-gray-400 space-y-1">

              <p>
                📌 Nhiệm vụ: {p.tasks?.length || 0}
              </p>

              <p>
                👥 Thành viên: {p.members?.length || 0}
              </p>

              <p>
                📅 Ngày tạo: {p.createdAt || "Chưa rõ"}
              </p>

            </div>

            {/* MINI HINT */}
            <div className="mt-4 text-xs text-blue-400">
              Nhấp để mở bảng →
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}

