import { useState } from "react";
import ProjectCard from "../components/ProjectCard";

export default function ProjectPage() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Jira Clone App",
      status: "In Progress",
      progress: 65,
      tasks: ["UI Layout", "Drag Drop", "Auth"],
      members: 4,
      createdAt: "2026-06-01",
    },
    {
      id: 2,
      name: "Portfolio Website",
      status: "Done",
      progress: 100,
      tasks: ["Design", "Deploy", "SEO"],
      members: 1,
      createdAt: "2026-05-20",
    },
    {
      id: 3,
      name: "E-commerce Dashboard",
      status: "In Progress",
      progress: 40,
      tasks: ["Product CRUD", "Chart Analytics", "Order Table"],
      members: 3,
      createdAt: "2026-06-10",
    },
    {
      id: 4,
      name: "Chat App Real-time",
      status: "To Do",
      progress: 10,
      tasks: ["Socket setup", "UI chat box"],
      members: 2,
      createdAt: "2026-06-12",
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  // ➜ ADD PROJECT (chỉ name)
  const handleAddProject = () => {
    if (!name.trim()) return;

    const newProject = {
      id: Date.now(),
      name,
      status: "To Do",
      progress: 0,
      tasks: [],
      members: 1,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setProjects([newProject, ...projects]);
    setName("");
    setIsOpen(false);
  };

  // ➜ SEARCH
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070a12] text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>

        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project..."
            className="bg-[#0b0f1a] border border-gray-800 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
          />

          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
          >
            + Add Project
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* EMPTY STATE */}
      {filteredProjects.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          No projects found
        </div>
      )}

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#0b0f1a] p-6 rounded-xl w-[360px] border border-gray-800">

            <h2 className="text-lg font-bold mb-4">Create Project</h2>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name..."
              className="w-full mb-4 px-3 py-2 bg-[#070a12] border border-gray-700 rounded outline-none focus:border-blue-500"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleAddProject}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
              >
                Create
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}