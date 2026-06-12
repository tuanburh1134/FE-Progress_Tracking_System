import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

/* ================= TASK ================= */
function TaskCard({
  task,
  team,
  onEdit,
  onDelete,
  onChangeAssignee,
}) {
  const [menu, setMenu] = useState(false);

  const {
  setNodeRef,
  attributes,
  listeners,
  transform,
  transition,
  isDragging,
} = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        }}
      className="p-3 mb-2 bg-black border border-gray-800 rounded"
    >
      <div className="flex justify-between">

        <div className="flex flex-col gap-2">
          <p className="font-semibold">{task.name}</p>

          <div className="flex gap-1">
            {team.map((m) => {
              const active = task.assignee?.id === m.id;

              return (
                <button
                  key={m.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeAssignee(task, m);
                  }}
                  className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center border
                    ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-300"
                    }`}
                >
                  {m.name.charAt(0)}
                </button>
              );
            })}
          </div>
        </div>

        {/* MENU */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenu(!menu);
            }}
          >
            ⋯
          </button>

          {menu && (
            <div className="absolute right-0 mt-2 bg-[#111] border border-gray-700 text-xs rounded z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                  setMenu(false);
                }}
                className="block px-3 py-2 hover:bg-gray-700"
              >
                Edit
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task);
                  setMenu(false);
                }}
                className="block px-3 py-2 hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= COLUMN ================= */
function Column({
  column,
  tasks,
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
  team,
  onEditTask,
  onDeleteTask,
  onChangeAssignee,
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(column.name);
  const [hover, setHover] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
  <div
    ref={setNodeRef}
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
    className="w-[280px] flex-shrink-0"
  >
    {/* BOARD WRAPPER */}
    <div className="p-3 bg-[#0b0f1a] border border-gray-800 rounded min-h-[400px] flex flex-col h-full">

      {/* HEADER */}
      <div className="mb-3 flex justify-between items-center">

        {edit ? (
          <input
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setEdit(false);
              onRenameColumn(column.id, title);
            }}
            className="bg-black border px-2 py-1 w-full"
          />
        ) : (
          <h2
            onDoubleClick={() => setEdit(true)}
            className="font-bold cursor-pointer"
          >
            {column.name}
          </h2>
        )}

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenu(!menu);
            }}
          >
            ⋯
          </button>

          {menu && (
            <div className="absolute right-0 mt-2 bg-[#111] border border-gray-700 text-xs rounded z-50">
              <button
                onClick={() => onDeleteColumn(column.id)}
                className="block px-3 py-2 hover:bg-red-600"
              >
                Delete column
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TASK LIST */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            team={team}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onChangeAssignee={onChangeAssignee}
          />
        ))}
      </SortableContext>

      {/* CREATE TASK */}
      {hover && (
        <button
          onClick={() => onAddTask(column.id)}
          className="mt-3 text-sm text-gray-400 hover:text-white text-left"
        >
          + Create task
        </button>
      )}
    </div>
  </div>
);
}

/* ================= MAIN ================= */
export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

 const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // kéo đi 8px mới kích hoạt drag → tránh click nhầm menu
    },
  })
);

  const [projectName, setProjectName] = useState("");
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);

  const [modal, setModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [name, setName] = useState("");
  const [assignee, setAssignee] = useState("");

  const [newCol, setNewCol] = useState(false);
  const [newColName, setNewColName] = useState("");

  /* ================= LOAD ================= */
  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const current = projects.find((p) => p.id === id);
    if (current) setProjectName(current.name);

    const cols =
      JSON.parse(localStorage.getItem("columns_" + id)) || [];

    const tks =
      JSON.parse(localStorage.getItem("tasks_" + id)) || [];

    if (cols.length === 0) {
      const init = [
        { id: "todo", name: "To Do" },
        { id: "doing", name: "In Progress" },
        { id: "review", name: "Review" },
        { id: "done", name: "Done" },
      ];
      setColumns(init);
      localStorage.setItem("columns_" + id, JSON.stringify(init));
    } else {
      setColumns(cols);
    }

    setTasks(tks);

    const teamData = JSON.parse(localStorage.getItem("team")) || [];
    setTeam(teamData);
  }, [id]);

  const saveTasks = (data) => {
    setTasks(data);
    localStorage.setItem("tasks_" + id, JSON.stringify(data));
  };

  const saveColumns = (data) => {
    setColumns(data);
    localStorage.setItem("columns_" + id, JSON.stringify(data));
  };

  /* ================= TASK ================= */
  const openCreate = (colId) => {
    setEditTask({ status: colId });
    setName("");
    setAssignee("");
    setModal(true);
  };

  const saveTask = () => {
    if (!name.trim()) return;

    let updated;

    if (editTask?.id) {
      updated = tasks.map((t) =>
        t.id === editTask.id
          ? { ...t, name, assignee: team.find((m) => m.id === assignee) }
          : t
      );
    } else {
      updated = [
        ...tasks,
        {
          id: Date.now().toString(),
          name,
          status: editTask.status,
          assignee: team.find((m) => m.id === assignee),
        },
      ];
    }

    saveTasks(updated);
    setModal(false);
  };

  const deleteTask = (task) => {
    saveTasks(tasks.filter((t) => t.id !== task.id));
  };

  const changeAssignee = (task, member) => {
    saveTasks(
      tasks.map((t) =>
        t.id === task.id ? { ...t, assignee: member } : t
      )
    );
  };

  /* ================= COLUMN ================= */
  const addColumn = () => {
    if (!newColName.trim()) return;

    const col = {
      id: Date.now().toString(),
      name: newColName,
    };

    saveColumns([...columns, col]);
    setNewCol(false);
    setNewColName("");
  };

  const renameColumn = (id, name) => {
    saveColumns(columns.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const deleteColumn = (id) => {
    saveColumns(columns.filter((c) => c.id !== id));
    saveTasks(tasks.filter((t) => t.status !== id));
  };

  /* ================= DRAG FIX ================= */
  const handleDragEnd = ({ active, over }) => {
  if (!over) return;

  const overId = over.id;

  const activeTask = tasks.find((t) => t.id === active.id);
  if (!activeTask) return;

  const activeCol = activeTask.status;

  // COLUMN DROP
  const overColumn = columns.find((c) => c.id === overId);

  if (overColumn) {
    if (activeCol === overColumn.id) return;

    saveTasks(
      tasks.map((t) =>
        t.id === active.id
          ? { ...t, status: overColumn.id }
          : t
      )
    );
    return;
  }

  // TASK DROP
  const overTask = tasks.find((t) => t.id === overId);
  if (!overTask) return;

  const newCol = overTask.status;

  if (newCol !== activeCol) {
    saveTasks(
      tasks.map((t) =>
        t.id === active.id
          ? { ...t, status: newCol }
          : t
      )
    );
    return;
  }

  // SORT SAME COLUMN
  const same = tasks.filter((t) => t.status === activeCol);

  const oldIndex = same.findIndex((t) => t.id === active.id);
  const newIndex = same.findIndex((t) => t.id === overId);

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

  const reordered = arrayMove(same, oldIndex, newIndex);
  const others = tasks.filter((t) => t.status !== activeCol);

  saveTasks([...others, ...reordered]);
};

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-black text-white p-6">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/project")}
          className="text-blue-500 hover:underline"
        >
          ← Back to Project
        </button>

        <h1 className="text-2xl font-bold">{projectName}</h1>
      </div>

      {/* BOARD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        >
        <div className="flex gap-4 items-start">

          {columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={tasks.filter((t) => t.status === col.id)}
              onAddTask={openCreate}
              onRenameColumn={renameColumn}
              onDeleteColumn={deleteColumn}
              team={team}
              onEditTask={(t) => {
                setEditTask(t);
                setName(t.name);
                setAssignee(t.assignee?.id || "");
                setModal(true);
              }}
              onDeleteTask={deleteTask}
              onChangeAssignee={changeAssignee}
            />
          ))}

          {/* ADD COLUMN */}
          <div className="w-[280px] flex-shrink-0 flex items-start">
            {newCol ? (
              <div className="bg-[#0b0f1a] border border-gray-700 p-3 rounded w-full">
                <input
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full bg-black border px-2 py-1 mb-2"
                  placeholder="Column name"
                />

                <div className="flex gap-2">
                  <button
                    onClick={addColumn}
                    className="bg-blue-600 px-3 py-1 rounded"
                  >
                    Add
                  </button>

                  <button onClick={() => setNewCol(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setNewCol(true)}
                className="w-10 h-10 rounded-full border border-gray-600 text-xl flex items-center justify-center text-gray-400 hover:text-white"
              >
                +
              </button>
            )}
          </div>

        </div>
      </DndContext>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-[#0b0f1a] p-6 rounded w-[400px]">

            <h2 className="text-lg mb-4">
              {editTask?.id ? "Edit Task" : "Create Task"}
            </h2>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 mb-3 bg-black border"
              placeholder="Task name"
            />

            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full p-2 mb-3 bg-black border"
            >
              <option value="">Assign member</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(false)}>
                Cancel
              </button>

              <button
                onClick={saveTask}
                className="bg-blue-600 px-3 py-1 rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}