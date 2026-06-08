import { useEffect, useState } from "react";


import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

const COLUMNS = ["To Do", "In Progress", "Review", "Done"];
/* ================= TASK ================= */
function TaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="p-3 mb-2 bg-black border border-gray-800 rounded cursor-grab active:cursor-grabbing"
    >
      {task.name}
    </div>
  );
}

/* ================= COLUMN ================= */
import { useDroppable } from "@dnd-kit/core";

function Column({ col, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: col, // OK rồi
  });

  return (
    <div
      ref={setNodeRef}
      data-id={col}
      className={`p-3 rounded min-h-[400px] transition ${
        isOver ? "bg-[#1a2233]" : "bg-[#0b0f1a]"
      }`}
    >
      <h2 className="font-bold mb-3 text-gray-300">{col}</h2>
      {children}
    </div>
  );
}

/* ================= MAIN ================= */
export default function ProjectPage() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
const [openModal, setOpenModal] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  /* LOAD */
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("projects"));

    if (!stored || stored.length === 0) {
      const fake = [
        { id: "1", name: "Setup React", status: "To Do" },
        { id: "2", name: "Design UI", status: "In Progress" },
        { id: "3", name: "Build Login", status: "Review" },
        { id: "4", name: "Deploy App", status: "Done" },
      ];

      setProjects(fake);
      localStorage.setItem("projects", JSON.stringify(fake));
    } else {
      setProjects(stored);
    }
  }, []);

  const save = (data) => {
    setProjects(data);
    localStorage.setItem("projects", JSON.stringify(data));
  };

  /* ADD TASK */
  const addProject = () => {
    if (!name.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      name,
      status: "To Do",
    };

    save([...projects, newTask]);
    setName("");
  };

  const getByStatus = (status) =>
    projects.filter((p) => p.status === status);

  /* ================= DRAG END (FIX CHUẨN) ================= */
    const handleDragEnd = ({ active, over }) => {
  if (!over) return;

  const activeTask = projects.find((p) => p.id === active.id);
  if (!activeTask) return;

  const activeCol = activeTask.status;

  // check nếu drop vào column
  const overIsColumn = COLUMNS.includes(over.id);

  let newStatus = activeCol;

  if (overIsColumn) {
    newStatus = over.id;
  } else {
    const overTask = projects.find((p) => p.id === over.id);
    if (overTask) {
      newStatus = overTask.status;
    }
  }

  let updated = [...projects];

  /* ================= MOVE COLUMN ================= */
  if (newStatus !== activeCol) {
    updated = updated.map((p) =>
      p.id === active.id
        ? { ...p, status: newStatus }
        : p
    );

    save(updated);
    return;
  }

  /* ================= SORT TRONG CÙNG COLUMN ================= */
  const sameColumn = projects.filter(
    (p) => p.status === activeCol
  );

  const oldIndex = sameColumn.findIndex((t) => t.id === active.id);
  const newIndex = sameColumn.findIndex((t) => t.id === over.id);

  if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
    const reordered = arrayMove(sameColumn, oldIndex, newIndex);

    const others = projects.filter(
      (p) => p.status !== activeCol
    );

    updated = [...others, ...reordered];

    save(updated);
  }
};

  return (
    <div className="min-h-screen bg-black text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-400 text-sm">
            Kanban Drag & Drop Board
          </p>
        </div>

        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New task..."
            className="p-3 rounded-lg bg-[#0b0f1a] border border-gray-700"
          />
          <button
        onClick={() => setOpenModal(true)}
        className="bg-blue-600 px-4 rounded-lg"
        >
        Add
        </button>
        </div>
      </div>

      {/* BOARD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">

          {COLUMNS.map((col) => {
            const items = getByStatus(col);

            return (
              <Column key={col} col={col}>
                <SortableContext
                  items={items.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </SortableContext>
              </Column>
            );
          })}

        </div>
      </DndContext>
      {openModal && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
    
    <div className="bg-[#0b0f1a] p-6 rounded-lg w-[400px] border border-gray-700">

      <h2 className="text-lg font-bold mb-4">Create New Task</h2>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Task name..."
        className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
      />

      <div className="flex justify-end gap-2">

        <button
          onClick={() => {
            setOpenModal(false);
            setName("");
          }}
          className="px-3 py-2 text-gray-400"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            addProject();
            setOpenModal(false);
          }}
          className="px-4 py-2 bg-blue-600 rounded"
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
