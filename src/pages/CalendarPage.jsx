import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiCalendar, 
  FiChevronLeft, 
  FiChevronRight, 
  FiFilter, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiFolder, 
  FiUser, 
  FiX, 
  FiExternalLink,
  FiUserCheck
} from "react-icons/fi";
import projectService from "@/features/projects/services/projectService";
import taskService from "@/features/tasks/services/taskService";
import useAuthStore from "../store/authStore";

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  // User Auth
  const storeUser = useAuthStore((s) => s.user);
  const localUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || localStorage.getItem("user_info") || "null");
    } catch { return null; }
  }, []);
  const currentUser = storeUser || localUser;

  // Filters
  const [selectedAssignee, setSelectedAssignee] = useState("MY_TASKS"); // "MY_TASKS" | "ALL"
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [selectedStatusCategory, setSelectedStatusCategory] = useState("ALL"); // "ALL" | "COMPLETED" | "PENDING" | "OVERDUE"

  // Check if a task is assigned to current user
  const isTaskAssignedToUser = useCallback((task, user) => {
    if (!user) return true;
    if (!task.assignee) return false;

    const uId = String(user.id || "");
    const uEmail = (user.email || "").toLowerCase().trim();
    const uName = (user.fullName || user.username || "").toLowerCase().trim();

    const aId = String(task.assignee.id || "");
    const aEmail = (task.assignee.email || "").toLowerCase().trim();
    const aName = (task.assignee.fullName || task.assignee.name || task.assignee.username || "").toLowerCase().trim();

    if (uId && aId && uId === aId) return true;
    if (uEmail && aEmail && uEmail === aEmail) return true;
    if (uName && aName && uName === aName) return true;

    return false;
  }, []);

  // Category determination
  const getTaskStatusCategory = useCallback((task) => {
    const isDone = task.status === "done" || task.status === "COMPLETED";
    if (isDone) return "COMPLETED";

    const dateStr = task.dueDate || task.deadline;
    if (!dateStr) return "PENDING";

    const todayStr = new Date().toISOString().split("T")[0];
    const taskDateStr = new Date(dateStr).toISOString().split("T")[0];

    if (taskDateStr < todayStr) {
      return "OVERDUE";
    }
    return "PENDING";
  }, []);

  // Color helper according to user's specification:
  // - Đã hoàn thành: Màu xanh (Green)
  // - Sát ngày chưa hoàn thành: Màu vàng (Yellow)
  // - Quá hạn chưa hoàn thành: Màu xám (Gray)
  const getTaskCalendarStyle = useCallback((task) => {
    const cat = getTaskStatusCategory(task);

    if (cat === "COMPLETED") {
      return {
        category: "COMPLETED",
        badgeLabel: "Đã hoàn thành",
        badgeClass: "bg-emerald-600 text-white font-bold",
        cardClass: "bg-emerald-100/90 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 shadow-sm",
        textClass: "text-emerald-950 dark:text-emerald-200",
        dotClass: "bg-emerald-500",
        badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
      };
    } else if (cat === "OVERDUE") {
      return {
        category: "OVERDUE",
        badgeLabel: "Quá hạn",
        badgeClass: "bg-gray-500 text-white font-bold",
        cardClass: "bg-gray-200/90 text-gray-800 dark:bg-gray-800/90 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-gray-500 shadow-sm",
        textClass: "text-gray-800 dark:text-gray-300",
        dotClass: "bg-gray-500",
        badgeColor: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
      };
    } else {
      return {
        category: "PENDING",
        badgeLabel: "Sát ngày / Đang làm",
        badgeClass: "bg-amber-500 text-white font-bold",
        cardClass: "bg-amber-100/90 text-amber-950 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:border-amber-500 shadow-sm",
        textClass: "text-amber-950 dark:text-amber-200",
        dotClass: "bg-amber-500",
        badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
      };
    }
  }, [getTaskStatusCategory]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch projects from API
      let apiProjects = [];
      try {
        const projRes = await projectService.getProjects(0, 100);
        apiProjects = projRes?.content || projRes?.data?.content || projRes?.data || (Array.isArray(projRes) ? projRes : []);
      } catch (e) {
        console.warn("Lỗi lấy danh sách dự án từ API:", e);
      }

      // 2. Fetch projects from LocalStorage
      const localProjects = JSON.parse(localStorage.getItem("projects") || "[]");

      // 3. Unique list of projects
      const projMap = new Map();
      [...apiProjects, ...localProjects].forEach((p) => {
        if (p && p.id) {
          projMap.set(String(p.id), p);
        }
      });
      const allProjects = Array.from(projMap.values());
      setProjects(allProjects);

      // 4. Fetch tasks for all projects (both API & LocalStorage)
      let combinedTasks = [];
      for (const proj of allProjects) {
        const projId = proj.id;
        let pTasks = [];

        // API tasks
        try {
          const res = await taskService.getTasksByProject(projId);
          if (Array.isArray(res)) pTasks = [...res];
        } catch (e) {
          // ignore
        }

        // LocalStorage tasks ("tasks_" + projId)
        const localTks = JSON.parse(localStorage.getItem("tasks_" + projId) || "[]");
        localTks.forEach((lt) => {
          if (!pTasks.some((pt) => String(pt.id) === String(lt.id))) {
            pTasks.push(lt);
          }
        });

        // Normalize task object
        const normalized = pTasks.map((t) => ({
          ...t,
          id: String(t.id),
          title: t.name || t.title || "Công việc không tên",
          dueDate: t.deadline || t.dueDate || null,
          status: t.status || "todo",
          priority: t.priority || (t.score >= 8 ? "URGENT" : t.score >= 5 ? "HIGH" : "MEDIUM"),
          projectName: proj.name || "Dự án",
          projectId: projId,
          assignee: t.assignee || null,
        }));

        combinedTasks = [...combinedTasks, ...normalized];
      }

      setTasks(combinedTasks);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu lịch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const handleUpdate = () => fetchData();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("storage-update", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("storage-update", handleUpdate);
    };
  }, [fetchData]);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const todayMonth = () => {
    setCurrentDate(new Date());
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskDate = task.dueDate || task.deadline;
      if (!taskDate) return false;

      // Filter by Assignee
      if (selectedAssignee === "MY_TASKS") {
        if (!isTaskAssignedToUser(task, currentUser)) return false;
      }

      // Filter by Project
      if (selectedProject !== "ALL" && String(task.projectId) !== String(selectedProject)) {
        return false;
      }

      // Filter by Status Category
      if (selectedStatusCategory !== "ALL") {
        const cat = getTaskStatusCategory(task);
        if (cat !== selectedStatusCategory) return false;
      }

      return true;
    });
  }, [tasks, selectedAssignee, selectedProject, selectedStatusCategory, currentUser, isTaskAssignedToUser, getTaskStatusCategory]);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Convert Sunday (0) -> 6, Monday (1) -> 0 for Mon-Sun grid
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const totalDays = lastDayOfMonth.getDate();

  // Create calendar grid cells
  const calendarCells = useMemo(() => {
    const cells = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Previous month filler days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      cells.push({
        date: new Date(year, month - 1, d),
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      cells.push({
        date: new Date(year, month, d),
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Next month filler days (to make total 35 or 42 cells)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        date: new Date(year, month + 1, d),
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month, startDayOfWeek, totalDays]);

  // Helper to match dates
  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const today = new Date();

  // Month name formatted in Vietnamese
  const monthName = currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

  // Stats in current month
  const stats = useMemo(() => {
    const monthTasks = filteredTasks.filter((t) => {
      const dateStr = t.dueDate || t.deadline;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    let completed = 0;
    let pending = 0;
    let overdue = 0;

    monthTasks.forEach((t) => {
      const cat = getTaskStatusCategory(t);
      if (cat === "COMPLETED") completed++;
      else if (cat === "OVERDUE") overdue++;
      else pending++;
    });

    return { total: monthTasks.length, completed, pending, overdue };
  }, [filteredTasks, month, year, getTaskStatusCategory]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── HEADER ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <FiCalendar className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                Lịch Công Việc
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Theo dõi tiến độ và hạn chót các công việc được phân công
              </p>
            </div>
          </div>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={todayMonth}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition"
          >
            Hôm nay
          </button>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={prevMonth}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition"
              title="Tháng trước"
            >
              <FiChevronLeft className="text-lg" />
            </button>
            <span className="px-4 text-sm font-semibold text-gray-900 dark:text-white capitalize min-w-[130px] text-center">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition"
              title="Tháng sau"
            >
              <FiChevronRight className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <FiCalendar className="text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tổng deadline tháng</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
        </div>

        {/* Green - Completed */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-sm">
            <FiCheckCircle className="text-xl" />
          </div>
          <div>
            <p className="text-xs text-emerald-800 dark:text-emerald-400 font-bold">Đã hoàn thành</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
          </div>
        </div>

        {/* Yellow - Due soon / Pending */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-amber-500 text-white rounded-xl shadow-sm">
            <FiClock className="text-xl" />
          </div>
          <div>
            <p className="text-xs text-amber-800 dark:text-amber-400 font-bold">Sát ngày / Đang làm</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{stats.pending}</p>
          </div>
        </div>

        {/* Gray - Overdue */}
        <div className="bg-gray-100/80 dark:bg-gray-800/80 p-4 rounded-2xl border border-gray-300 dark:border-gray-700 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-gray-500 text-white rounded-xl shadow-sm">
            <FiAlertCircle className="text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-bold">Quá hạn chưa hoàn thành</p>
            <p className="text-xl font-extrabold text-gray-700 dark:text-gray-300">{stats.overdue}</p>
          </div>
        </div>
      </div>

      {/* ── FILTERS & LEGEND ──────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm shadow-sm">
        
        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium mr-1">
            <FiFilter className="text-base text-blue-500" />
            <span>Bộ lọc:</span>
          </div>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-3 py-2 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-semibold rounded-xl border border-blue-200 dark:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="MY_TASKS">👤 Công việc của tôi</option>
            <option value="ALL">🌐 Tất cả công việc trong dự án</option>
          </select>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Tất cả dự án ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                📁 {p.name}
              </option>
            ))}
          </select>

          {/* Status Category Filter */}
          <select
            value={selectedStatusCategory}
            onChange={(e) => setSelectedStatusCategory(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái màu</option>
            <option value="COMPLETED">🟢 Đã hoàn thành (Màu xanh)</option>
            <option value="PENDING">🟡 Sát ngày / Đang làm (Màu vàng)</option>
            <option value="OVERDUE">⚪ Quá hạn chưa hoàn thành (Màu xám)</option>
          </select>
        </div>

        {/* Legend Guide */}
        <div className="flex items-center gap-3 text-xs bg-gray-50 dark:bg-gray-800/60 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 self-start md:self-auto">
          <div className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Đã hoàn thành</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Sát ngày</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500 inline-block" />
            <span>Quá hạn</span>
          </div>
        </div>

      </div>

      {/* ── CALENDAR GRID ─────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-center font-semibold text-xs text-gray-500 dark:text-gray-400 py-3 uppercase tracking-wider">
          <div>Thứ 2</div>
          <div>Thứ 3</div>
          <div>Thứ 4</div>
          <div>Thứ 5</div>
          <div>Thứ 6</div>
          <div className="text-blue-600 dark:text-blue-400">Thứ 7</div>
          <div className="text-red-500 dark:text-red-400">Chủ nhật</div>
        </div>

        {/* Grid Cells */}
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-3" />
            <p className="font-medium text-sm">Đang đồng bộ danh sách công việc các dự án...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-200 dark:divide-gray-800">
            {calendarCells.map((cell, idx) => {
              const isToday = isSameDay(cell.date, today);
              
              // Find tasks on this date
              const dayTasks = filteredTasks.filter((t) => {
                const dateStr = t.dueDate || t.deadline;
                if (!dateStr) return false;
                const taskDate = new Date(dateStr);
                return isSameDay(taskDate, cell.date);
              });

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 flex flex-col transition ${
                    !cell.isCurrentMonth
                      ? "bg-gray-50/50 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600"
                      : "bg-white dark:bg-[#111827]"
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                          : cell.isCurrentMonth
                          ? "text-gray-900 dark:text-gray-200"
                          : "text-gray-400 dark:text-gray-600"
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                        {dayTasks.length} việc
                      </span>
                    )}
                  </div>

                  {/* Day task list */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-0.5 custom-scrollbar">
                    {dayTasks.slice(0, 3).map((task) => {
                      const style = getTaskCalendarStyle(task);
                      return (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className={`w-full text-left p-1.5 rounded-lg border text-xs transition transform hover:-translate-y-0.5 ${style.cardClass}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-semibold truncate max-w-[110px]">
                              {task.title}
                            </span>
                            <span className={`flex-shrink-0 text-[9px] px-1 py-0.2 rounded font-bold ${style.badgeClass}`}>
                              {style.badgeLabel === "Đã hoàn thành" ? "✓" : style.badgeLabel === "Quá hạn" ? "Trễ" : "Hạn"}
                            </span>
                          </div>
                          <p className="text-[10px] opacity-85 truncate font-medium">
                            📁 {task.projectName}
                          </p>
                        </button>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <button
                        onClick={() => setSelectedTask(dayTasks[3])}
                        className="w-full text-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
                      >
                        + {dayTasks.length - 3} công việc nữa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ──────────────────────────────── */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5 animate-scaleUp">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <FiFolder className="text-xs" /> {selectedTask.projectName}
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                {selectedTask.description}
              </div>
            )}

            {/* Badges & Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Trạng thái công việc</p>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getTaskCalendarStyle(selectedTask).badgeColor}`}>
                  {getTaskCalendarStyle(selectedTask).badgeLabel}
                </span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <FiUserCheck className="text-purple-500 text-lg flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Người thực hiện</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {selectedTask.assignee?.fullName || selectedTask.assignee?.name || selectedTask.assignee?.username || "Chưa giao"}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-2 col-span-2">
                <FiClock className="text-blue-500 text-lg flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Hạn chót (Deadline)</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {new Date(selectedTask.dueDate || selectedTask.deadline).toLocaleDateString("vi-VN", {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setSelectedTask(null);
                  navigate(`/project/${selectedTask.projectId}`);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/25 transition"
              >
                <span>Xem trong Bảng Kanban</span>
                <FiExternalLink />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
