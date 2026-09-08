import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { askGemini } from "../services/geminiService";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import useAuthStore from "../store/authStore";

/* ─── helpers ─── */
const isOverdue = (task) => {
  if (!task.deadline || task.status === "done") return false;
  const today = new Date().toISOString().split("T")[0];
  return task.deadline <= today;
};

const isCompletedOnTime = (task) => {
  if (task.status !== "done") return false;
  if (!task.deadline) return true;
  const compDate = task.completedAt || task.deadline;
  return compDate <= task.deadline;
};

const isTaskOverdue = (task) => {
  const today = new Date().toISOString().split("T")[0];
  if (task.status === "done") {
    if (!task.deadline || !task.completedAt) return false;
    return task.completedAt > task.deadline;
  }
  if (!task.deadline) return false;
  return task.deadline < today;
};

const getRemainingDays = (deadline) => {
  if (!deadline) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  const diffTime = dl.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/* ═══════════════════════════════════════
   CHATBOT WIDGET (góc phải màn hình)
═══════════════════════════════════════ */
function ChatbotWidget({ open, onClose, initialQuestion }) {
  const [messages, setMessages] = useState([
    { from: "ai", text: "Xin chào! Tôi là Trợ lý AI. Tôi có thể giúp gì cho bạn?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (initialQuestion) {
      setMessages([
        { from: "ai", text: "Xin chào! Tôi là Trợ lý AI. Tôi có thể giúp gì cho bạn?" },
        { from: "user", text: initialQuestion },
      ]);
      simulateReply(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const simulateReply = (q) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, {
        from: "ai",
        text: `Tôi đã ghi nhận vấn đề: "${q}". Dựa trên dữ liệu dự án, tôi gợi ý bạn kiểm tra lại logic xử lý và xem xét tái cấu trúc module liên quan. Bạn có muốn tôi phân tích sâu hơn không?`,
      }]);
    }, 1400);
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    simulateReply(text);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] w-80 flex flex-col bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-blue-700/50 rounded-2xl shadow-2xl shadow-blue-900/20 dark:shadow-blue-900/30 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/20 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">Trợ lý AI</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm transition">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 max-h-64 min-h-[160px] scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${
              m.from === "user"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-2 rounded-xl text-xs flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0b0f1a] rounded-b-2xl">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Nhập câu hỏi..."
          className="flex-1 bg-gray-50 border border-gray-200 dark:bg-black dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"
        />
        <button
          onClick={send}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-xl transition shadow-sm"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

const isSameMember = (m1, m2) => {
  if (!m1 || !m2) return false;
  if (m1.id && m2.id && String(m1.id) === String(m2.id)) return true;
  if (m1.email && m2.email && String(m1.email).toLowerCase() === String(m2.email).toLowerCase()) return true;
  if (m1.username && m2.username && String(m1.username).toLowerCase() === String(m2.username).toLowerCase()) return true;
  if (m1.githubUsername && m2.githubUsername && String(m1.githubUsername).toLowerCase() === String(m2.githubUsername).toLowerCase()) return true;
  const name1 = m1.fullName || m1.name;
  const name2 = m2.fullName || m2.name;
  if (name1 && name2 && String(name1).toLowerCase().trim() === String(name2).toLowerCase().trim()) return true;
  return false;
};

/* ═══════════════════════════════════════
   TASK CARD CONTENT
═══════════════════════════════════════ */
function TaskCardContent({ task, team, onEdit, onDelete, onChangeAssignee, onChangeScore, onOpenAI, onAISwap, dragHandleProps, isManager }) {
  const [menu, setMenu] = useState(false);
  const [editScore, setEditScore] = useState(false);
  const [scoreInput, setScoreInput] = useState(task.score ?? "");
  const currentUser = useAuthStore((s) => s.user);
  
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menu) return;
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menu]);

  const remaining = getRemainingDays(task.deadline);
  const isDone = task.status === "done";
  const isOverdueTask = !isDone && task.deadline && remaining < 0;
  const isUrgent = !isDone && task.deadline && remaining >= 0 && remaining <= 1;

  // Quyết định class màu sắc động
  let cardBgClass = "";
  let taskNameColor = "";
  let subtextColor = "";
  let scoreBorderColor = "";

  if (isOverdueTask) {
    cardBgClass = "bg-black border-2 border-red-600 animate-pulse-border shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-400";
    taskNameColor = "text-red-400";
    subtextColor = "text-red-500/80";
    scoreBorderColor = "text-red-400 border-red-600 bg-red-950/20";
  } else if (isUrgent) {
    cardBgClass = "bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-400 dark:border-amber-600/50";
    taskNameColor = "text-amber-950 dark:text-amber-100";
    subtextColor = "text-amber-800 dark:text-amber-400/80";
    scoreBorderColor = "text-amber-600 border-amber-400 bg-amber-500/10 dark:text-amber-400 dark:border-amber-600";
  } else {
    // Bình thường: xanh dương nhạt
    cardBgClass = "bg-blue-50/75 dark:bg-slate-900/80 border border-blue-200 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-700/60";
    taskNameColor = "text-blue-950 dark:text-blue-100";
    subtextColor = "text-blue-800/80 dark:text-blue-400/80";
    scoreBorderColor = task.score >= 8 ? "text-green-600 border-green-300 dark:text-green-400 dark:border-green-600" :
                       task.score >= 5 ? "text-yellow-600 border-yellow-300 dark:text-yellow-400 dark:border-yellow-600" :
                       task.score > 0  ? "text-red-600 border-red-300 dark:text-red-400 dark:border-red-600" :
                                         "text-gray-500 border-gray-300 dark:text-gray-400 dark:border-gray-700";
  }

  const handleScoreBlur = () => {
    const v = parseInt(scoreInput);
    const val = isNaN(v) ? null : Math.min(10, Math.max(1, v));
    setEditScore(false);
    onChangeScore?.(task, val);
  };

  return (
    <div
      {...dragHandleProps}
      className={`p-3 mb-2 rounded-xl transition select-none cursor-grab active:cursor-grabbing ${cardBgClass}`}
    >
      {/* Cảnh báo trạng thái */}
      {isOverdueTask && (
        <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-red-500/15 border border-red-500/40 rounded-lg">
          <span className="text-red-400 text-[10px] font-bold animate-pulse">ĐÃ TRỄ HẠN</span>
        </div>
      )}

      {isUrgent && (
        <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-amber-500/15 border border-amber-500/40 rounded-lg">
          <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold animate-pulse">Sắp hết hạn (Còn &lt; 1 ngày)</span>
        </div>
      )}

      {/* Row 1: tên + menu */}
      <div className="flex justify-between items-start mb-2">
        <p className={`font-semibold text-sm leading-snug flex-1 pr-2 ${taskNameColor}`}>{task.name}</p>

        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenu(!menu); }}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white px-1 transition"
          >
            ⋯
          </button>

          {menu && (
            <div className="absolute right-0 mt-1 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 text-xs rounded-xl overflow-hidden z-50 shadow-lg w-32">
              {isManager && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit?.(task); setMenu(false); }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                >
                  Chỉnh sửa
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onOpenAI?.(task); setMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
              >
                Nhờ AI hỗ trợ
              </button>
              {task.status !== "done" && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAISwap?.(task); setMenu(false); }}
                  className="block w-full text-left px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-yellow-400 font-medium border-t border-gray-100 dark:border-gray-800 flex items-center justify-between"
                >
                  <span>Nhờ AI đổi việc</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">Task khó</span>
                </button>
              )}
              {isManager && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete?.(task); setMenu(false); }}
                  className="block w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-medium"
                >
                  Xóa
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Điểm + Lỗi + Avatar */}
      <div className="flex items-center gap-2">
        {/* Điểm độ khó */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (!isManager) return;
            setEditScore(true);
            setScoreInput(task.score ?? "");
          }}
          className="flex-shrink-0"
          title={isManager ? "Điểm độ khó (1-10)" : "Điểm độ khó (Chỉ Trưởng nhóm/Quản lý mới có quyền chỉnh)"}
        >
          {editScore && isManager ? (
            <input
              autoFocus
              type="number" min={1} max={10}
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              onBlur={handleScoreBlur}
              onKeyDown={(e) => e.key === "Enter" && handleScoreBlur()}
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-6 text-center text-xs bg-white dark:bg-black border border-blue-500 rounded-lg outline-none text-gray-900 dark:text-white"
            />
          ) : (
            <span
              className={`inline-flex items-center justify-center w-10 h-6 text-xs font-bold border rounded-lg transition ${scoreBorderColor} ${!isManager ? "cursor-default" : "cursor-pointer"}`}
              title={isManager ? "Bấm để chỉnh điểm" : "Điểm độ khó"}
            >
              {task.score != null ? task.score : "—"}
            </span>
          )}
        </div>

        {/* Nhãn lỗi kiểm thử */}
        {task.bugCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 h-6 text-[10px] font-bold border border-red-600 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-900/20 rounded-lg flex-shrink-0">
            {task.bugCount} lỗi
          </span>
        )}

        {/* Avatar người thực hiện */}
        <div className="flex gap-1 flex-wrap justify-end ml-auto">
          {team.map((m) => {
            const active = task.assignee?.id === m.id;
            return (
              <button
                key={m.id}
                disabled={!isManager}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isManager) return;
                  onChangeAssignee?.(task, m);
                }}
                title={isManager ? m.name : `${m.name} (Chỉ Trưởng nhóm/Quản lý mới được phân công)`}
                className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center border transition
                  ${!isManager ? "cursor-default opacity-85" : ""}
                  ${active
                    ? "bg-blue-600 border-blue-400 text-white ring-1 ring-blue-400 font-bold"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-500"}`}
              >
                {m.name.charAt(0)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: tên người được giao + deadline + nút AI Đổi việc */}
      <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-200/40 dark:border-gray-800/40">
        {task.assignee
          ? <p className={`text-[10px] ${subtextColor}`}>Giao: <span className="font-semibold">{task.assignee.name}</span></p>
          : <span />
        }

        <div className="flex items-center gap-1.5">
          {task.status !== "done" && (
            <button
              onClick={(e) => { e.stopPropagation(); onAISwap?.(task); }}
              className="text-[10px] px-1.5 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-700 dark:text-yellow-400 font-bold border border-amber-500/30 transition flex items-center gap-1"
              title="Task quá khó? Bấm để nhờ AI tự động tìm thành viên nhẹ tải và hoán đổi công việc"
            >
              <span>AI Đổi</span>
            </button>
          )}
          {task.deadline && (
            <span className={`text-[10px] font-mono ${isOverdueTask ? "text-red-400 font-bold" : subtextColor}`}>
              {task.deadline}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   TASK CARD — sortable wrapper
═══════════════════════════════════════ */
function TaskCard({ task, team, onEdit, onDelete, onChangeAssignee, onChangeScore, onOpenAI, onAISwap, isManager }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? "none" : transition,
        opacity: isDragging ? 0 : 1,
      }}
    >
      <TaskCardContent
        task={task} team={team}
        onEdit={onEdit} onDelete={onDelete}
        onChangeAssignee={onChangeAssignee}
        onChangeScore={onChangeScore}
        onOpenAI={onOpenAI}
        onAISwap={onAISwap}
        dragHandleProps={{ ...attributes, ...listeners }}
        isManager={isManager}
      />
    </div>
  );
}

/* ═══════════════════════════════════════
   COLUMN
═══════════════════════════════════════ */
function Column({ column, tasks, onAddTask, onRenameColumn, onDeleteColumn, team, onEditTask, onDeleteTask, onChangeAssignee, onChangeScore, onOpenAI, onAISwap, isManager }) {
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
      className="w-[260px] sm:w-[280px] flex-shrink-0"
    >
      <div className="p-3 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-300 dark:border-gray-800 rounded-2xl min-h-[420px] max-h-[calc(100vh-260px)] flex flex-col">
        {/* Header */}
        <div className="mb-3 flex justify-between items-center px-1 flex-shrink-0">
          <h2 className="font-bold text-sm select-none text-gray-800 dark:text-gray-100">{column.name}</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {tasks.length}
          </span>
        </div>

        {/* Tasks - Cuộn trang theo chiều dọc cho từng cột */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} team={team}
                onEdit={onEditTask} onDelete={onDeleteTask}
                onChangeAssignee={onChangeAssignee}
                onChangeScore={onChangeScore}
                onOpenAI={onOpenAI}
                onAISwap={onAISwap}
                isManager={isManager}
              />
            ))}
          </SortableContext>
        </div>

        {hover && isManager && (
          <button
            onClick={() => onAddTask(column.id)}
            className="mt-3 text-sm text-gray-400 hover:text-white text-left py-1 px-2 rounded-lg hover:bg-gray-800/50 transition flex-shrink-0"
          >
            + Tạo công việc
          </button>
        )}
      </div>
    </div>
  );
}

/* Helper giải mã URL Github — dùng chung cho AIHubTab và CICDTab */
function parseGithubUrl(url) {
  if (!url) return null;
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith(".git")) {
    cleanUrl = cleanUrl.slice(0, -4);
  }
  const httpsMatch = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }
  const sshMatch = cleanUrl.match(/github\.com:([^\/]+)\/([^\/]+)/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }
  return null;
}

/* ═══════════════════════════════════════
   TABS
═══════════════════════════════════════ */
const TABS = [
  { id: "kanban",   label: "Bảng công việc (Kanban)" },
  { id: "cicd",     label: "Luồng Đẩy Code & Kiểm thử (CI/CD Git)" },
  { id: "ai",       label: "Trung tâm Trợ lý AI (AI Hub & Chatbot)" },
  { id: "report",   label: "Báo cáo & Phân tích Rủi ro" },
  { id: "members",  label: "Thành viên" },
];

/* ═══════════════════════════════════════
   AI HUB TAB
═══════════════════════════════════════ */
function AIHubTab({ tasks, team, saveTasks, projectId, projectName, initialSwapTask }) {
  const bottomRef = useRef(null);

  /* ── Git state: khai báo sớm để projectDetailedContext useMemo có thể dùng ── */
  const gitUrl = useMemo(() => {
    return localStorage.getItem("project_git_" + projectId) || "";
  }, [projectId]);

  const [gitTree, setGitTree] = useState([]);
  const [gitTreeLoading, setGitTreeLoading] = useState(false);
  const [selectedGitFiles, setSelectedGitFiles] = useState([]);
  const [gitFilesContent, setGitFilesContent] = useState({});
  const [fetchingFiles, setFetchingFiles] = useState({});

  const projectDetailedContext = useMemo(() => {
    const projName = projectName || "Dự án hiện tại";
    const teamMembersStr = team.map(m => `- ${m.fullName || m.name || m.username || 'Thành viên'} (Vai trò: ${m.role || 'Thành viên'})`).join("\n") || "Chưa có thành viên";
    const tasksStr = tasks.map(t => {
      const assigneeName = t.assignee ? (t.assignee.fullName || t.assignee.name || t.assignee.username || "Thành viên") : "Chưa phân công";
      return `- Tác vụ: "${t.name}" | Trạng thái: ${t.status} | Độ ưu tiên: ${t.priority || 'Medium'} | Giao cho: ${assigneeName} | Hạn chót: ${t.deadline || 'Chưa có'} | Số lỗi: ${t.bugCount || 0} | Điểm khó: ${t.score != null && t.score !== '' ? t.score : 'Chưa chấm'}`;
    }).join("\n") || "Chưa có công việc nào";

    // Lịch sử commit giả lập từ tab CICD
    const statuses = ["success", "success", "success", "failed", "running"];
    const msgs = [
      "feat: thêm chức năng xác thực người dùng",
      "fix: sửa lỗi validate form đăng nhập",
      "refactor: tách logic service layer",
      "feat: tích hợp JWT authentication",
      "fix: xử lý exception NullPointerException",
      "test: thêm unit test cho UserService",
      "feat: hoàn thiện API quản lý dự án",
      "fix: sửa lỗi ngày tháng không đúng định dạng",
      "chore: cập nhật dependencies",
      "feat: thêm drag-drop cho Kanban board",
    ];
    const branches = ["main", "develop", "feature/auth", "feature/kanban", "hotfix/login"];
    const commitRows = [];
    team.forEach((m, mi) => {
      const myTasks = tasks.filter((t) => t.assignee?.id === m.id);
      const count = Math.max(2, myTasks.length + 1);
      for (let i = 0; i < count; i++) {
        const relatedTask = myTasks[i % Math.max(myTasks.length, 1)];
        const bugCount = relatedTask?.bugCount || 0;
        const status = bugCount > 0 && i === 0 ? "failed" : statuses[(mi * 3 + i) % statuses.length];
        commitRows.push({
          author: m.name,
          message: relatedTask ? `feat: ${relatedTask.name.slice(0, 40)}` : msgs[(mi * 2 + i) % msgs.length],
          branch: branches[(mi + i) % branches.length],
          status,
          sha: Math.random().toString(16).slice(2, 7), // Tạo mã SHA ngắn
        });
      }
    });
    
    const commitsStr = commitRows.map(c => `- Commit [${c.sha}] trên nhánh ${c.branch} bởi ${c.author}: "${c.message}" (Trạng thái build: ${c.status})`).join("\n") || "Chưa có commit nào";

    // Thêm bối cảnh code của các file đã chọn
    let codeContextStr = "";
    selectedGitFiles.forEach(path => {
      const content = gitFilesContent[path];
      if (content) {
        codeContextStr += `\n\n--- BỐI CẢNH FILE: ${path} ---\n${content}\n`;
      }
    });

    return `
[TÊN DỰ ÁN]
${projName}

[DANH SÁCH THÀNH VIÊN]
${teamMembersStr}

[DANH SÁCH CÔNG VIỆC (KANBAN)]
${tasksStr}

[LỊCH SỬ COMMITS & KIỂM THỬ (GIT CI/CD)]
${commitsStr}
${selectedGitFiles.length > 0 ? `\n[MÃ NGUỒN CÁC FILE LIÊN KẾT TỪ GIT (CONTEXT)]:\n${codeContextStr}` : ""}
    `;
  }, [projectName, tasks, team, selectedGitFiles, gitFilesContent]);

  const currentUser = useAuthStore((s) => s.user);

  const [messages,        setMessages]        = useState(() => {
    const saved = localStorage.getItem(`ai_chat_${projectId}_${currentUser?.id || "guest"}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved chat messages:", e);
      }
    }
    return [
      {
        from: "ai",
        type: "text",
        text: [
          "✨ Xin chào! Tôi là **Trợ lý AI Gemini** của dự án.",
          "Tôi có thể giúp bạn:",
          "• Phân tích và gợi ý sửa lỗi code",
          "• Điều phối công việc khi trễ hạn",
          "• Đề xuất hoán đổi task giữa các thành viên",
          "• Trả lời bất kỳ câu hỏi nào về dự án!",
        ].join("\n"),
      },
    ];
  });
  const [input,           setInput]           = useState("");
  const [typing,          setTyping]          = useState(false);
  const [selectedTask,    setSelectedTask]    = useState("");
  const [reassignProposal,setReassignProposal]= useState(null);
  /** Lưu lịch sử hội thoại để gửi cho Gemini (tiết kiệm token: chỉ 4 tin nhắn cuối) */
  const chatHistory = useRef([]);

  /* ────────────────────────────────
     Kịch bản 2: Không thể hoàn thành — Đề xuất hoán đổi
  ──────────────────────────────── */
  const handleCannotFinish = (targetTask = null) => {
    const task = targetTask || tasks.find((t) => t.id === selectedTask);
    if (!task) {
      setMessages((p) => [...p, { from: "user", type: "text", text: "Tôi không thể hoàn thành tác vụ này đúng hạn." }]);
      setMessages((p) => [...p, { from: "ai", type: "text", text: "Vui lòng chọn công việc cụ thể ở ô bên dưới trước khi gửi yêu cầu này để tôi có thể tìm người phù hợp hỗ trợ bạn." }]);
      return;
    }

    setMessages((p) => [...p, {
      from: "user", type: "text",
      text: `Tôi thấy công việc “${task.name}” quá khó hoặc không đủ thời gian hoàn thành. Nhờ AI tư vấn hoán đổi việc.`,
    }]);

    /* Tìm thành viên nhẹ tải nhất (nhất ít task chưa done) */
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const currentAssignee = task.assignee;
      const candidates = team.filter((m) => String(m.id) !== String(currentAssignee?.id));

      const memberPool = candidates.length > 0 ? candidates : team;

      /* Đếm số task chưa done của mỗi thành viên */
      const workload = memberPool.map((m) => ({
        member: m,
        count: tasks.filter((t) => String(t.assignee?.id) === String(m.id) && t.status !== "done").length,
      }));
      workload.sort((a, b) => a.count - b.count);
      const best = workload[0] || { member: team[0] || { name: "Thành viên nhóm" }, count: 0 };

      /* Tìm task nhẹ nhất của người đó để hoán đổi ngược lại */
      const swapTask = tasks.find(
        (t) => String(t.assignee?.id) === String(best.member.id) && t.status !== "done" && t.id !== task.id
      );

      setReassignProposal({
        fromTask: task,
        toMember: best.member,
        swapTask: swapTask || null,
        fromMember: currentAssignee,
      });

      setMessages((p) => [...p, {
        from: "ai", type: "text",
        text: `Tôi đã quét dữ liệu ${team.length} thành viên trong nhóm. **${best.member.name}** đang có khối lượng công việc nhẹ nhất (${best.count} tasks). Dưới đây là đề xuất hoán đổi công việc tự động:`,
      }]);
    }, 1200);
  };

  useEffect(() => {
    if (initialSwapTask) {
      setSelectedTask(initialSwapTask.id);
      handleCannotFinish(initialSwapTask);
    }
  }, [initialSwapTask]);

  useEffect(() => {
    const githubInfo = parseGithubUrl(gitUrl);
    if (!githubInfo) {
      setGitTree([]);
      return;
    }

    const fetchTree = async () => {
      setGitTreeLoading(true);
      try {
        const { owner, repo } = githubInfo;
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!repoRes.ok) throw new Error("Repository not found or private");
        const repoData = await repoRes.json();
        const branch = repoData.default_branch || "main";

        const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
        if (!treeRes.ok) throw new Error("Failed to load repository tree");
        const treeData = await treeRes.json();

        const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.java', '.py', '.cpp', '.c', '.h', '.cs', '.html', '.css', '.json', '.md', '.yml', '.yaml', '.xml', '.properties', '.gradle', '.sql'];
        const ignoredPaths = ['node_modules/', '.git/', '.idea/', '.vscode/', 'dist/', 'build/', 'target/', 'package-lock.json', 'yarn.lock'];

        const filtered = (treeData.tree || [])
          .filter(item => item.type === "blob")
          .filter(item => {
            const isCode = codeExtensions.some(ext => item.path.toLowerCase().endsWith(ext));
            const isIgnored = ignoredPaths.some(ignored => item.path.includes(ignored));
            return isCode && !isIgnored;
          })
          .map(item => item.path);

        setGitTree(filtered);
      } catch (err) {
        console.warn("Lỗi tải danh sách file từ GitHub:", err);
        setGitTree([]);
      } finally {
        setGitTreeLoading(false);
      }
    };

    fetchTree();
  }, [gitUrl]);

  const handleToggleFile = async (path) => {
    const githubInfo = parseGithubUrl(gitUrl);
    if (!githubInfo) return;

    if (selectedGitFiles.includes(path)) {
      setSelectedGitFiles(prev => prev.filter(p => p !== path));
      return;
    }

    setSelectedGitFiles(prev => [...prev, path]);
    if (gitFilesContent[path]) return;

    setFetchingFiles(prev => ({ ...prev, [path]: true }));
    try {
      const { owner, repo } = githubInfo;
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
      if (!res.ok) throw new Error("Failed to load file content");
      const data = await res.json();
      
      const raw = atob(data.content.replace(/\s/g, ''));
      const content = decodeURIComponent(escape(raw));
      
      setGitFilesContent(prev => ({ ...prev, [path]: content }));
    } catch (err) {
      console.warn("Lỗi tải nội dung file:", err);
      setSelectedGitFiles(prev => prev.filter(p => p !== path));
      alert("Không thể tải nội dung file này (có thể do giới hạn API GitHub hoặc file quá lớn).");
    } finally {
      setFetchingFiles(prev => ({ ...prev, [path]: false }));
    }
  };

  // Tự động cắt tỉa tin nhắn (lời chào + 10 tin nhắn gần nhất) và lưu trữ vào localStorage
  useEffect(() => {
    const key = `ai_chat_${projectId}_${currentUser?.id || "guest"}`;
    if (messages.length > 11) {
      const greeting = messages[0];
      const recent = messages.slice(-10);
      setMessages([greeting, ...recent]);
    } else {
      localStorage.setItem(key, JSON.stringify(messages));
    }
  }, [messages, projectId, currentUser]);

  // Đồng bộ bối cảnh hội thoại (history) gửi lên Gemini
  useEffect(() => {
    const historyMsgs = messages
      .filter((m, i) => {
        // Bỏ qua lời chào đầu tiên nếu nó trùng khớp với lời chào mặc định
        if (i === 0 && m.from === "ai" && m.text.includes("Xin chào! Tôi là **Trợ lý AI Gemini**")) {
          return false;
        }
        return m.type === "text" || !m.type;
      })
      .map((m) => ({
        role: m.from === "user" ? "user" : "model",
        text: m.text,
      }))
      .slice(-10); // Lấy tối đa 10 tin gần nhất cho bối cảnh của Gemini
    chatHistory.current = historyMsgs;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, reassignProposal]);

  /* — Typing indicator rồi thêm tin AI — */
  const pushAI = (msgObj, delay = 1200) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((p) => [...p, { from: "ai", ...msgObj }]);
    }, delay);
  };

  /* ────────────────────────────────
     Kịch bản 1: Sửa lỗi code
  ──────────────────────────────── */
  const handleAnalyzeBug = () => {
    const task = tasks.find((t) => t.id === selectedTask);
    if (!task) return;

    setMessages((p) => [
      ...p,
      { from: "user", type: "text", text: `Phân tích lỗi kiểm thử cho task: "${task.name}" (${task.bugCount || 0} lỗi)` },
    ]);

    pushAI({
      type: "code",
      title: `Phân tích lỗi: "${task.name}"`,
      body: `Tôi đã đọc lịch sử commit và phát hiện lỗi tại service liên quan:

**Lỗi phát hiện:** Sai định dạng xử lý dữ liệu ở mô-đun "${task.name}"

**Câu lệnh lỗi (dòng 45):**`,
      codeBefore: `// SAI - Dữ liệu chưa được validate
public void process(String input) {
    Date d = new SimpleDateFormat("dd/MM/yyyy").parse(input);
    repository.save(new Record(d, input));
}`,
      codeAfter: `// ĐÃ SỬa - Validate + xử lý ngoại lệ đúng cách
public void process(String input) {
    if (input == null || input.isBlank())
        throw new IllegalArgumentException("Input không hợp lệ");
    try {
        LocalDate d = LocalDate.parse(input,
            DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        repository.save(new Record(d, input));
    } catch (DateTimeParseException e) {
        log.error("Sai định dạng ngày: {}", input, e);
        throw new BadRequestException("Định dạng ngày không đúng. Yêu cầu: dd/MM/yyyy");
    }
}`,
      footer: `Hãy thay thế đoạn code cũ bằng đoạn đã sửa trên. Task đã giảm từ **${task.bugCount || 1} lỗi** xuống 0 sau khi áp dụng fix này.`,
    }, 1800);
  };



  /* ── Thực hiện hoán đổi ── */
  const confirmReassign = () => {
    if (!reassignProposal) return;
    const { fromTask, toMember, swapTask, fromMember } = reassignProposal;

    const updated = tasks.map((t) => {
      if (t.id === fromTask.id) return { ...t, assignee: toMember };
      if (swapTask && t.id === swapTask.id) return { ...t, assignee: fromMember || null };
      return t;
    });
    saveTasks(updated);
    setReassignProposal(null);

    setMessages((p) => [...p, {
      from: "ai", type: "text",
      text: `✅ Hoán đổi thành công! Task “${fromTask.name}” đã được chuyển sang **${toMember.name}**. Bảng Kanban đã được cập nhật.`,
    }]);
  };


  /* ── Gửi tin nhắn — gọi Gemini thực sự ── */
  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((p) => [...p, { from: "user", type: "text", text }]);
    setInput("");

    // Từ khoá đặc biệt → xử lý local, không tốn token AI
    const lower = text.toLowerCase();
    if (
      lower.includes("không thể hoàn thành") ||
      lower.includes("trễ hạn") ||
      lower.includes("không xong")
    ) {
      handleCannotFinish();
      return;
    }
    if (
      lower.includes("lỗi") ||
      lower.includes("bug") ||
      lower.includes("fix") ||
      lower.includes("sửa")
    ) {
      pushAI({
        type: "text",
        text: "Vui lòng chọn task có lỗi từ danh sách bên dưới rồi bấm **Phân tích lỗi** để tôi đọc lịch sử code và gợi ý sửa.",
      });
      return;
    }

    // Gọi Gemini thực sự với context dự án (tiết kiệm token tối đa)
    setTyping(true);
    try {
      const aiText = await askGemini(text, chatHistory.current, { tasks, team, projectDetailedContext });
      chatHistory.current = [
        ...chatHistory.current.slice(-6),
        { role: "user",  text },
        { role: "model", text: aiText },
      ];
      setTyping(false);
      setMessages((p) => [...p, { from: "ai", type: "text", text: aiText }]);
    } catch (err) {
      setTyping(false);
      setMessages((p) => [
        ...p,
        { from: "ai", type: "text", text: `❌ Lỗi kết nối Gemini: ${err.message}` },
      ]);
    }
  };


  /* ── Render message ── */
  const renderMsg = (m, i) => {
    if (m.from === "user") {
      return (
        <div key={i} className="flex justify-end">
          <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[75%] leading-relaxed">
            {m.text}
          </div>
        </div>
      );
    }

    if (m.type === "code") {
      return (
        <div key={i} className="flex justify-start">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl rounded-tl-sm max-w-[90%] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-700">
              <p className="text-xs font-bold text-blue-400">✨ {m.title}</p>
            </div>
            <div className="px-4 py-3 space-y-3">
              {m.body.split("\n").map((line, li) => (
                <p key={li} className={`text-xs leading-relaxed ${
                  line.startsWith("**") ? "font-bold text-white" : "text-gray-300"
                }`}>
                  {line.replace(/\*\*/g, "")}
                </p>
              ))}
              <div>
                <p className="text-[10px] text-red-400 mb-1 font-semibold uppercase tracking-wider">Code cũ (có lỗi)</p>
                <pre className="bg-red-950/40 border border-red-800/50 text-red-300 text-[11px] p-3 rounded-xl overflow-x-auto font-mono leading-relaxed">{m.codeBefore}</pre>
              </div>
              <div>
                <p className="text-[10px] text-green-400 mb-1 font-semibold uppercase tracking-wider">Code đã sửa</p>
                <pre className="bg-green-950/40 border border-green-800/50 text-green-300 text-[11px] p-3 rounded-xl overflow-x-auto font-mono leading-relaxed">{m.codeAfter}</pre>
              </div>
              <p className="text-xs text-gray-400 italic leading-relaxed">{m.footer}</p>
            </div>
          </div>
        </div>
      );
    }

    /* text thường */
    return (
      <div key={i} className="flex justify-start">
        <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[80%] leading-relaxed whitespace-pre-line border bg-gray-100 border-gray-200 text-gray-800 dark:bg-[#111827] dark:border-gray-800 dark:text-gray-200">
          {m.text.replace(/\*\*(.*?)\*\*/g, "$1")}
        </div>
      </div>
    );
  };

  const bugTasks = tasks.filter((t) => (t.bugCount || 0) > 0 || isOverdue(t));
  const allActiveTasks = tasks.filter((t) => t.status !== "done");

  return (
    <div className="flex gap-5" style={{ height: "calc(100vh - 200px)", minHeight: "550px" }}>

      {/* CHAT PANEL */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden dark:bg-[#0b0f1a] dark:border-gray-800">

        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50/40 dark:border-gray-800 dark:from-blue-900/30 dark:to-indigo-900/10">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Trợ lý AI — Project Assistant</p>
            <p className="text-[10px] text-gray-600 dark:text-gray-500">Sẵn sàng hỗ trợ • Phân tích code • Điều phối công việc</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map(renderMsg)}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 dark:bg-[#111827] dark:border-gray-800">
                {[0, 150, 300].map((d, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-800">
          {/* Quick actions */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <button
              onClick={handleCannotFinish}
              className="text-xs px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-300 dark:hover:bg-red-900/50"
            >
              Tôi không thể hoàn thành task đúng hạn
            </button>
            <button
              onClick={handleAnalyzeBug}
              className="text-xs px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-100 transition dark:bg-yellow-900/30 dark:border-yellow-700/50 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
            >
              Phân tích lỗi code
            </button>
          </div>

          {/* Task selector */}
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="w-full mb-3 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-800 outline-none focus:border-blue-500 dark:bg-black dark:border-gray-700 dark:text-gray-300"
          >
            <option value="">— Chọn công việc để thực hiện thao tác —</option>
            <optgroup label="Có lỗi / Trễ hạn">
              {bugTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.bugCount > 0 ? ` (🐛 ${t.bugCount} lỗi)` : ""}{isOverdue(t) ? " ⚠️ Trễ hạn" : ""}
                </option>
              ))}
            </optgroup>
            <optgroup label="Tất cả task đang tiến hành">
              {allActiveTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
          </select>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Nhập tin nhắn cho Trợ lý AI..."
              className="flex-1 p-3 bg-gray-50 border border-gray-300 focus:border-blue-500 rounded-xl text-sm text-gray-900 outline-none placeholder-gray-400 dark:bg-black dark:border-gray-700 dark:text-white dark:placeholder-gray-600"
            />
            <button
              onClick={send}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Tóm tắt + Đề xuất */}
      <div className="w-72 flex flex-col gap-4 overflow-y-auto pr-1">

        {/* Overdue tasks list */}
        <div className="rounded-2xl p-4 bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800">
          <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">⚠️ Nguy cơ trễ hạn</p>
          {tasks.filter(isOverdue).length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">Không có task nào trễ hạn.
              <span className="text-green-600 dark:text-green-400 font-semibold"> Tuyệt vời!</span>
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.filter(isOverdue).map((t) => (
                <div key={t.id} className="p-2 bg-red-50 border border-red-100 rounded-xl dark:bg-red-900/10 dark:border-red-800/30">
                  <p className="text-xs font-medium text-red-800 dark:text-red-300">{t.name}</p>
                  {t.assignee && <p className="text-[10px] text-gray-600 dark:text-gray-500 mt-0.5">{t.assignee.name}</p>}
                  <p className="text-[10px] text-red-600 dark:text-red-500 mt-0.5 font-medium">Hạn: {t.deadline}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bug tasks */}
        <div className="rounded-2xl p-4 bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800">
          <p className="text-xs font-bold text-amber-600 dark:text-yellow-400 uppercase tracking-wider mb-3">🐛 Lỗi kiểm thử</p>
          {tasks.filter((t) => t.bugCount > 0).length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">Không có lỗi nào.</p>
          ) : (
            <div className="space-y-2">
              {tasks.filter((t) => t.bugCount > 0).map((t) => (
                <div key={t.id} className="p-2 bg-amber-50 border border-amber-100 rounded-xl dark:bg-yellow-900/10 dark:border-yellow-800/30">
                  <p className="text-xs font-medium text-amber-900 dark:text-yellow-300">{t.name}</p>
                  <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 font-medium">{t.bugCount} lỗi tồn đọng</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tải trọng thành viên */}
        <div className="rounded-2xl p-4 bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">👥 Tải trọng nhóm</p>
          {team.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">Chưa có thành viên.</p>
          ) : (
            <div className="space-y-2">
              {team.map((m) => {
                const cnt = tasks.filter((t) => t.assignee?.id === m.id && t.status !== "done").length;
                const pct = Math.min(100, cnt * 20);
                return (
                  <div key={m.id}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-700 font-medium dark:text-gray-300">{m.name}</span>
                      <span className="text-gray-500">{cnt} task</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          pct >= 80 ? "bg-red-500" : pct >= 40 ? "bg-amber-500 dark:bg-yellow-500" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MÃ NGUỒN GIT CHỌN LỌC */}
        {gitUrl && (
          <div className="rounded-2xl p-4 bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">📁 Mã nguồn Git đính kèm</p>
            <p className="text-[10px] text-gray-500 mb-3">Tích chọn file để đính kèm vào bối cảnh hỏi AI</p>

            {gitTreeLoading ? (
              <p className="text-xs text-gray-500 italic animate-pulse">Đang tải danh sách file...</p>
            ) : gitTree.length === 0 ? (
              <p className="text-xs text-gray-500 italic">Không tìm thấy file code hoặc repository private.</p>
            ) : (
              <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {gitTree.map((path) => {
                  const isSelected = selectedGitFiles.includes(path);
                  const isFetching = fetchingFiles[path];
                  const hasContent = !!gitFilesContent[path];
                  
                  return (
                    <label key={path} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isFetching}
                        onChange={() => handleToggleFile(path)}
                        className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 dark:text-gray-300 truncate" title={path}>
                          {path.split('/').pop()}
                        </p>
                        <p className="text-[9px] text-gray-400 truncate" title={path}>
                          {path}
                        </p>
                        {isFetching && (
                          <span className="text-[8px] text-blue-400 animate-pulse">Đang tải code...</span>
                        )}
                        {!isFetching && hasContent && isSelected && (
                          <span className="text-[8px] text-green-400 font-medium">✓ Đã đính kèm ({gitFilesContent[path].split('\n').length} dòng)</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* HỘP THOẠI ĐỀ XUẤT HOÁN ĐỔI */}
      {reassignProposal && (
        <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-blue-100 rounded-2xl w-[480px] shadow-2xl shadow-blue-500/10 animate-fadeIn dark:bg-[#0b0f1a] dark:border-blue-700/50 dark:shadow-blue-900/20">

            <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-600 dark:text-blue-400 text-lg">✨</span>
                <h2 className="font-bold text-gray-900 dark:text-white">AI đề xuất: Hoán đổi công việc</h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hệ thống sẽ tự động cập nhật Bảng Kanban sau khi xác nhận</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Task bị chuyển */}
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl dark:bg-red-900/10 dark:border-red-800/30">
                <p className="text-[10px] text-red-600 dark:text-red-400 uppercase font-semibold mb-1">Chuyển task này sang</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{reassignProposal.fromTask.name}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="text-gray-500">
                    {reassignProposal.fromMember?.name || "(chưa giao)"}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">→</span>
                  <span className="text-green-600 dark:text-green-400 font-bold">{reassignProposal.toMember.name}</span>
                </div>
              </div>

              {/* Swap ngược lại */}
              {reassignProposal.swapTask && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl dark:bg-blue-900/10 dark:border-blue-800/30">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-semibold mb-1">{reassignProposal.toMember.name} nhận lại</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{reassignProposal.swapTask.name}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-gray-500">{reassignProposal.toMember.name}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">→</span>
                    <span className="text-amber-600 dark:text-yellow-400 font-bold">{reassignProposal.fromMember?.name || "(không rõ)"}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-600 dark:text-gray-500 leading-relaxed">
                Lý do: <span className="font-semibold text-gray-800 dark:text-gray-300">{reassignProposal.toMember.name}</span> đang có khối lượng công việc thấp nhất trong nhóm — AI đánh giá có thể tiếp nhận task này nhanh hơn.
              </p>
            </div>

            <div className="flex gap-3 px-6 pb-5 justify-end">
              <button
                onClick={() => setReassignProposal(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition dark:text-gray-400 dark:hover:text-white"
              >
                Từ chối
              </button>
              <button
                onClick={confirmReassign}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-sm transition"
              >
                ✅ ĐỒNG Ý — Hoán đổi ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   REPORT TAB
═══════════════════════════════════════ */
function ReportTab({ tasks, team, projectName, activeCommits = [] }) {

  /* ── IPRI (Integrated Project Risk Index) ── */
  const riskAnalysis = useMemo(() => {
    if (tasks.length === 0) {
      return { score: 0, schedule: 0, quality: 0, resource: 0, integration: 0 };
    }

    const today = new Date().toISOString().split("T")[0];

    // 1. SCHEDULE RISK (35%)
    const totalScore = tasks.reduce((sum, t) => sum + (parseInt(t.score) || 1), 0);
    const overdueTasks = tasks.filter(t => t.status !== "done" && t.deadline && t.deadline < today);
    const overdueScore = overdueTasks.reduce((sum, t) => sum + (parseInt(t.score) || 1), 0);
    const scheduleRisk = Math.round((overdueScore / totalScore) * 100);

    // 2. QUALITY RISK (30%)
    const activeTasks = tasks.filter(t => t.status !== "done");
    const totalBugs = tasks.reduce((sum, t) => sum + (t.bugCount || 0), 0);
    const qualityRisk = activeTasks.length > 0 
      ? Math.min(100, Math.round((totalBugs / activeTasks.length) * 20))
      : 0;

    // 3. RESOURCE RISK (20%)
    const unassignedTasks = tasks.filter(t => !t.assignee && t.status !== "done");
    const unassignedRatio = unassignedTasks.length / tasks.length;
    
    // Tính imbalance (phân bổ bất đối xứng)
    let maxWorkloadRatio = 0;
    if (team.length > 0) {
      const memberScores = team.map(m => {
        const myTasks = tasks.filter(t => t.assignee?.id === m.id && t.status !== "done");
        return myTasks.reduce((sum, t) => sum + (parseInt(t.score) || 1), 0);
      });
      const maxScore = Math.max(...memberScores);
      maxWorkloadRatio = totalScore > 0 ? maxScore / totalScore : 0;
    }
    const imbalanceFactor = maxWorkloadRatio > 0.5 ? 1 : 0; // quá tải nếu gánh > 50% tổng điểm
    const resourceRisk = Math.round((unassignedRatio * 60) + (imbalanceFactor * 40));

    // 4. INTEGRATION RISK (15%)
    const totalBuilds = activeCommits.length;
    const failedBuilds = activeCommits.filter(c => c.status === "failed").length;
    const integrationRisk = totalBuilds > 0 ? Math.round((failedBuilds / totalBuilds) * 100) : 0;

    // Tổng hợp chỉ số rủi ro
    const finalScore = Math.round(
      (0.35 * scheduleRisk) + 
      (0.30 * qualityRisk) + 
      (0.20 * resourceRisk) + 
      (0.15 * integrationRisk)
    );

    return {
      score: Math.min(100, Math.max(0, finalScore)),
      schedule: scheduleRisk,
      quality: qualityRisk,
      resource: resourceRisk,
      integration: integrationRisk
    };
  }, [tasks, team, activeCommits]);

  const riskScore = riskAnalysis.score;

  const riskColor =
    riskScore < 30 ? { bar: "#22c55e", text: "text-green-600 dark:text-green-400", label: "An toàn",           bg: "bg-green-500" } :
    riskScore < 60 ? { bar: "#eab308", text: "text-amber-600 dark:text-yellow-400", label: "Rủi ro trung bình", bg: "bg-yellow-500" } :
                     { bar: "#ef4444", text: "text-red-600 dark:text-red-400",    label: "Nguy hiểm!",        bg: "bg-red-500" };

  /* ── Biểu đồ 1: Trạng thái task ── */
  const taskStatusData = useMemo(() => [
    { name: "Chờ xử lý",      value: tasks.filter((t) => t.status === "todo").length,   color: "#64748b" },
    { name: "Đang thực hiện", value: tasks.filter((t) => t.status === "doing").length,  color: "#3b82f6" },
    { name: "Đang xem xét",   value: tasks.filter((t) => t.status === "review").length, color: "#f59e0b" },
    { name: "Hoàn thành",     value: tasks.filter((t) => t.status === "done").length,   color: "#22c55e" },
  ].filter((d) => d.value > 0), [tasks]);

  /* ── Biểu đồ 2: Hiệu suất thành viên ── */
  const memberPerfData = useMemo(() => team.map((m) => {
    const memberName = m.fullName || m.name || m.username || "Thành viên";
    const myTasks   = tasks.filter((t) => t.assignee?.id === m.id);
    const done      = myTasks.filter((t) => t.status === "done").length;
    const totalBugs = myTasks.reduce((s, t) => s + (t.bugCount || 0), 0);
    const commits   = Math.max(1, done * 3 + myTasks.length * 2);
    const failRate  = myTasks.length > 0 ? Math.round((totalBugs / Math.max(myTasks.length * 2, 1)) * 100) : 0;
    return {
      name:     memberName.length > 9 ? memberName.slice(0, 9) + "…" : memberName,
      fullName: memberName,
      commits,
      pass: 100 - Math.min(failRate, 100),
      fail: Math.min(failRate, 100),
      done,
      total: myTasks.length,
    };
  }), [tasks, team]);

  /* ── AI Recommendations ── */
  const aiRecommendations = useMemo(() => {
    const recs = [];
    const overdueList     = tasks.filter(isOverdue);
    const highBugMember   = [...memberPerfData].sort((a, b) => b.fail - a.fail)[0];
    const doneRatio       = tasks.length > 0 ? tasks.filter((t) => t.status === "done").length / tasks.length : 0;

    if (riskScore >= 60) {
      recs.push({ type: "danger",  icon: "🚨", title: "Nguy hiểm: Dự án có nguy cơ chậm deadline",
        body: `Chỉ số rủi ro đang ở mức ${riskScore}% — vượt ngưỡng an toàn. Tốc độ hoàn thành công việc của nhóm đang giảm so với kế hoạch ban đầu. Ước tính rủi ro chậm tiến độ khoảng 3–5 ngày.` });
    } else if (riskScore >= 30) {
      recs.push({ type: "warning", icon: "⚠️", title: "Cảnh báo: Tốc độ cần cải thiện",
        body: `Chỉ số rủi ro ${riskScore}% — mức trung bình. Nhóm nên tăng tần suất stand-up hàng ngày và rà soát task để phát hiện điểm nghẽn sớm.` });
    } else {
      recs.push({ type: "success", icon: "✅", title: "Dự án đang ở trạng thái tốt",
        body: `Chỉ số rủi ro chỉ ${riskScore}% — nằm trong vùng an toàn. Tiếp tục duy trì nhịp độ hiện tại.` });
    }

    if (overdueList.length > 0) {
      recs.push({ type: "warning", icon: "⏰", title: `Phát hiện ${overdueList.length} task trễ hạn`,
        body: `Các task: ${overdueList.map((t) => `"${t.name}"`).join(", ")} đang quá hạn. Khuyến nghị Trưởng nhóm họp khẩn hoặc sử dụng chức năng hoán đổi task tự động tại tab AI Hub.` });
    }

    if (highBugMember && highBugMember.fail >= 50) {
      recs.push({ type: "danger",  icon: "🐛", title: `Tỷ lệ fail test case cao: ${highBugMember.fullName}`,
        body: `Thành viên ${highBugMember.fullName} đang có tỷ lệ fail test case lên tới ${highBugMember.fail}%. Khuyến nghị: Trưởng nhóm cần họp khẩn để phân chia lại module, giảm tải để thành viên này có thời gian xử lý lỗi tồn đọng.` });
    }

    if (doneRatio >= 0.8) {
      recs.push({ type: "success", icon: "🏆", title: "Tiến độ xuất sắc",
        body: `${Math.round(doneRatio * 100)}% công việc đã hoàn thành. Nhóm đang làm việc rất hiệu quả!` });
    }

    if (recs.length <= 1) {
      recs.push({ type: "info", icon: "💡", title: "Gợi ý: Tăng cường kiểm thử tự động",
        body: "Hãy đảm bảo unit test coverage đạt ít nhất 80% trước khi demo sản phẩm cho Giảng viên hướng dẫn." });
    }

    return recs;
  }, [riskScore, tasks, memberPerfData]);

  const recStyle = {
    danger:  { border: "border-red-200 dark:border-red-800/50",    bg: "bg-red-50 dark:bg-red-900/10",    icon: "text-red-500 dark:text-red-400",    title: "text-red-800 dark:text-red-300" },
    warning: { border: "border-amber-200 dark:border-yellow-800/50", bg: "bg-amber-50 dark:bg-yellow-900/10", icon: "text-amber-500 dark:text-yellow-400", title: "text-amber-800 dark:text-yellow-300" },
    success: { border: "border-green-200 dark:border-green-800/50",  bg: "bg-green-50 dark:bg-green-900/10",  icon: "text-green-500 dark:text-green-400",  title: "text-green-800 dark:text-green-300" },
    info:    { border: "border-blue-200 dark:border-blue-800/50",   bg: "bg-blue-50 dark:bg-blue-900/10",   icon: "text-blue-500 dark:text-blue-400",   title: "text-blue-800 dark:text-blue-300" },
  };

  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 dark:bg-[#111827] dark:border-gray-700 px-3 py-2 rounded-xl text-xs shadow-lg">
        <p className="font-bold text-gray-900 dark:text-white">{payload[0].name}</p>
        <p className="text-gray-600 dark:text-gray-300">{payload[0].value} task ({tasks.length > 0 ? ((payload[0].value / tasks.length) * 100).toFixed(0) : 0}%)</p>
      </div>
    );
  };

  const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 dark:bg-[#111827] dark:border-gray-700 px-3 py-2 rounded-xl text-xs shadow-lg">
        <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}{p.name === "Commits" ? " lần" : "%"}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">

      {/* ─── RISK METER ─── */}
      <div className="bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Chỉ số Rủi ro Dự án</h2>
            <p className="text-xs text-gray-500 mt-0.5">Tự động tính toán từ dữ liệu task, lỗi và tiến độ</p>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-black tabular-nums ${riskColor.text}`}>{riskScore}%</p>
            <p className={`text-xs font-semibold mt-1 ${riskColor.text}`}>{riskColor.label}</p>
          </div>
        </div>

        {/* Thanh đo */}
        <div className="relative mb-2">
          <div className="h-6 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${riskScore}%`,
                background: `linear-gradient(90deg, ${riskColor.bar}bb, ${riskColor.bar})`,
                boxShadow: `0 0 12px ${riskColor.bar}60`,
              }}
            />
          </div>
          {/* Threshold markers */}
          <div className="absolute top-0 h-6 flex items-center" style={{ left: "30%" }}>
            <div className="w-px h-4 bg-green-600/40 dark:bg-green-500/50" />
          </div>
          <div className="absolute top-0 h-6 flex items-center" style={{ left: "60%" }}>
            <div className="w-px h-4 bg-amber-600/40 dark:bg-yellow-500/50" />
          </div>
        </div>
        <div className="flex text-[10px] text-gray-500 dark:text-gray-600 mb-5 font-medium">
          <span className="flex-none">0%</span>
          <span className="text-green-600 ml-[26%]">An toàn</span>
          <span className="text-amber-600 dark:text-yellow-600/70 ml-[22%]">Trung bình</span>
          <span className="text-red-600 ml-auto">100%</span>
        </div>

        {/* Pills */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Task trễ hạn",  val: tasks.filter(isOverdue).length,                                 color: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800/40" },
            { label: "Lỗi tồn đọng",  val: tasks.reduce((s, t) => s + (t.bugCount || 0), 0),                 color: "text-amber-800 bg-amber-50 border-amber-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800/40" },
            { label: "Hoàn thành",    val: `${tasks.filter((t) => t.status === "done").length}/${tasks.length}`, color: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800/40" },
            { label: "Chưa phân công", val: tasks.filter((t) => !t.assignee && t.status !== "done").length,  color: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800/40" },
          ].map((p) => (
            <div key={p.label} className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs ${p.color}`}>
              <span className="font-bold text-sm">{p.val}</span>
              <span className="opacity-80 dark:opacity-70">{p.label}</span>
            </div>
          ))}
        </div>

        {/* Hàng 4 cột rủi ro cấu thành */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/80">
          {[
            { name: "Tiến độ (Weight 35%)", val: riskAnalysis.schedule, color: "text-blue-500", desc: "Dựa trên điểm task quá hạn" },
            { name: "Chất lượng (Weight 30%)", val: riskAnalysis.quality, color: "text-red-500", desc: "Dựa trên mật độ lỗi/bugs" },
            { name: "Nhân lực (Weight 20%)", val: riskAnalysis.resource, color: "text-amber-500", desc: "Dựa trên cân bằng tải và task trống" },
            { name: "CI/CD Tích hợp (Weight 15%)", val: riskAnalysis.integration, color: "text-indigo-500", desc: "Dựa trên tỷ lệ build fail" },
          ].map((item) => (
            <div key={item.name} className="p-3 bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800/40 rounded-2xl flex flex-col justify-between">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{item.name}</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className={`text-xl font-black ${item.color}`}>{item.val}%</span>
                <span className="text-[9px] text-gray-400">rủi ro</span>
              </div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── BIỂU ĐỒ ─── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Biểu đồ 1: Trạng thái task */}
        <div className="bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Tỷ lệ trạng thái Task</h3>
          <p className="text-xs text-gray-500 mb-3">Phân bố công việc theo trạng thái hiện tại</p>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-400 dark:text-gray-600 text-sm">Chưa có task nào</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%" cy="50%"
                  innerRadius={58} outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {taskStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  formatter={(v) => <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{v}</span>}
                  iconType="circle" iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Biểu đồ 2: Hiệu suất thành viên */}
        <div className="bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Hiệu suất thành viên</h3>
          <p className="text-xs text-gray-500 mb-3">Tần suất commit và tỷ lệ Pass/Fail test case</p>
          {team.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-400 dark:text-gray-600 text-sm">Chưa có thành viên</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={memberPerfData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-[#1f2937]" />
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip content={<BarTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{v}</span>} iconSize={8} />
                <Bar dataKey="commits" name="Commits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pass"    name="Pass %"  fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fail"    name="Fail %"  fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── AI RECOMMENDATIONS ─── */}
      <div className="bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Phân tích & Khuyến nghị từ AI</h3>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
            Cập nhật: {new Date().toLocaleTimeString("vi-VN")}
          </span>
        </div>

        <div className="space-y-3 mb-5">
          {aiRecommendations.map((rec, i) => {
            const s = recStyle[rec.type];
            return (
              <div key={i} className={`p-4 border rounded-xl ${s.border} ${s.bg}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{rec.icon}</span>
                  <div>
                    <p className={`text-sm font-bold mb-1 ${s.title}`}>{rec.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{rec.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bảng chi tiết thành viên */}
        {team.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Chi tiết hiệu suất từng thành viên
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    {["Thành viên", "Task nhận", "Hoàn thành", "Commits", "Pass %", "Fail %", "Đánh giá"].map((h) => (
                      <th key={h} className="text-left text-gray-500 dark:text-gray-400 py-2.5 px-4 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                  {memberPerfData.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-200 font-semibold">{m.fullName}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">{m.total}</td>
                      <td className="py-3 px-4 text-green-600 dark:text-green-400 font-medium">{m.done}</td>
                      <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-medium">{m.commits}</td>
                      <td className="py-3 px-4 text-green-600 dark:text-green-400 font-medium">{m.pass}%</td>
                      <td className="py-3 px-4">
                        <span className={m.fail >= 50 ? "text-red-600 dark:text-red-400 font-bold" : "text-gray-500 dark:text-gray-400"}>
                          {m.fail}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          m.fail >= 50 ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50" :
                          m.fail >= 25 ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50" :
                                         "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50"
                        }`}>
                          {m.fail >= 50 ? "Cần hỗ trợ" : m.fail >= 25 ? "Cần theo dõi" : "Tốt"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   CI/CD TAB
═══════════════════════════════════════ */

function CICDTab({ 
  tasks, 
  team, 
  projectId, 
  activeCommits = [], 
  githubLoading = false, 
  githubError = "", 
  gitUrl = "", 
  githubCommits = [], 
  commitHistory = [] 
}) {
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [commitDiffLoading, setCommitDiffLoading] = useState(false);
  const [commitDiff, setCommitDiff] = useState(null);
  const [aiReviewing, setAiReviewing] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState(null);

  const generateMockDiff = (message) => {
    const msg = (message || "").toLowerCase();
    
    if (msg.includes("đăng nhập") || msg.includes("login") || msg.includes("auth")) {
      return [
        {
          filename: "src/main/java/com/projecttracker/controller/AuthController.java",
          status: "modified",
          additions: 15,
          deletions: 2,
          patch: `@@ -22,7 +22,18 @@
 @RestController
 @RequestMapping("/api/auth")
 public class AuthController {
-    // Todo: implement login endpoint
+
+    @PostMapping("/login")
+    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
+        Authentication authentication = authenticationManager.authenticate(
+            new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
+        );
+        SecurityContextHolder.getContext().setAuthentication(authentication);
+        String jwt = tokenProvider.generateToken(authentication);
+        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt));
+    }
+
     @PostMapping("/register")
     public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {`
        }
      ];
    }
    
    if (msg.includes("trang chủ") || msg.includes("home") || msg.includes("landing")) {
      return [
        {
          filename: "Frontend/src/pages/HomePage.jsx",
          status: "modified",
          additions: 12,
          deletions: 1,
          patch: `@@ -1,6 +1,17 @@
 import React from "react";
+import HeroSection from "../components/HeroSection";
+import StatsDashboard from "../components/StatsDashboard";
 
 export default function HomePage() {
-  return <div>Welcome</div>;
+  return (
+    <div className="min-h-screen bg-slate-900 text-white">
+      <HeroSection 
+        title="Quản Lý Công Việc Đột Phá Với AI" 
+        subtitle="Tự động hóa luồng làm việc Kanban và phân tích GitHub"
+      />
+      <StatsDashboard />
+    </div>
+  );
 }`
        }
      ];
    }

    if (msg.includes("giao diện") || msg.includes("css") || msg.includes("style") || msg.includes("màu")) {
      return [
        {
          filename: "Frontend/src/index.css",
          status: "modified",
          additions: 8,
          deletions: 0,
          patch: `@@ -74,4 +74,12 @@
+@keyframes bounceShort {
+  0%, 100% { transform: translateY(0); }
+  50% { transform: translateY(-4px); }
+}
+.animate-bounce-short {
+  animation: bounceShort 0.8s ease-in-out 3;
+}`
        }
      ];
    }

    // Default fallback
    return [
      {
        filename: "src/main/java/com/projecttracker/service/TaskService.java",
        status: "modified",
        additions: 5,
        deletions: 1,
        patch: `@@ -45,4 +45,8 @@
     public Task updateTaskStatus(String taskId, String status) {
         Task task = taskRepository.findById(taskId).orElseThrow();
-        task.setStatus(status);
+        task.setStatus(status);
+        if ("done".equals(status)) {
+            task.setCompletedAt(LocalDate.now());
+        }
         return taskRepository.save(task);
     }`
      }
    ];
  };

  const fetchCommitDiff = async (commit) => {
    setSelectedCommit(commit);
    setCommitDiffLoading(true);
    setCommitDiff(null);
    setAiReviewResult(null);

    let fetched = false;
    if (gitUrl && gitUrl.includes("github.com") && commit.sha) {
      try {
        const cleanUrl = gitUrl.replace(/\.git$/, "");
        const parts = cleanUrl.split("github.com/");
        if (parts.length > 1) {
          const pathParts = parts[1].split("/");
          if (pathParts.length >= 2) {
            const owner = pathParts[0];
            const repo = pathParts[1];
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`);
            if (res.ok) {
              const data = await res.json();
              if (data.files && data.files.length > 0) {
                const filesDiff = data.files.map(f => ({
                  filename: f.filename,
                  status: f.status,
                  additions: f.additions,
                  deletions: f.deletions,
                  patch: f.patch || "@@ -0,0 +1,0 @@\n+ File binary hoặc thay đổi không hiển thị được văn bản."
                }));
                setCommitDiff(filesDiff);
                fetched = true;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Lỗi fetch GitHub commit diff:", err);
      }
    }

    if (!fetched) {
      setTimeout(() => {
        setCommitDiff(generateMockDiff(commit.message));
        setCommitDiffLoading(false);
      }, 500);
      return;
    }
    setCommitDiffLoading(false);
  };

  const handleAIReview = async () => {
    if (!selectedCommit || !commitDiff) return;
    setAiReviewing(true);
    setAiReviewResult(null);

    const diffContent = commitDiff.map(f => `File: ${f.filename}\n${f.patch}`).join("\n\n");
    const taskName = selectedCommit.relatedTask?.name || "Không rõ";
    const commitMsg = selectedCommit.message;
    const deadline = selectedCommit.relatedTask?.deadline || "Không có";
    const commitTime = selectedCommit.time;

    // 🔍 Kiểm tra xem code diff có phải chỉ là comment (ví dụ //test) hay dòng thừa không
    const addedLines = [];
    commitDiff.forEach((f) => {
      if (f.patch) {
        f.patch.split("\n").forEach((line) => {
          if (line.startsWith("+") && !line.startsWith("+++")) {
            addedLines.push(line.slice(1).trim());
          }
        });
      }
    });

    const nonCommentAddedLines = addedLines.filter((l) => {
      if (!l) return false;
      if (l.startsWith("//") || l.startsWith("/*") || l.startsWith("*") || l.startsWith("#") || l.startsWith("<!--")) return false;
      return true;
    });

    const isOnlyCommentOrTrivia = addedLines.length > 0 && nonCommentAddedLines.length === 0;

    const userPrompt = `Đánh giá code thay đổi trong commit sau đây:
Commit Message: "${commitMsg}"
Task Liên Quan: "${taskName}"
Thời gian đẩy code: "${commitTime}" (Hạn hoàn thành task - Deadline: "${deadline}")

Nội dung code diff:
\`\`\`diff
${diffContent}
\`\`\`

CHÚ Ý ĐẶC BIỆT KHI ĐÁNH GIÁ:
- Nếu code diff CHỈ chứa các dòng comment (ví dụ: //test, //, /*), dòng trống hoặc hoàn toàn KHÔNG CÓ MÃ NGUỒN LOGIC THỰC THI NÀO, bạn BẮT BUỘC phải đánh giá:
  + Độ liên quan: Thấp
  + Độ ổn định: Thấp
  + Mức độ rủi ro: Cao

Hãy phân tích và chấm điểm mã nguồn này theo đúng 3 tiêu chí:
1. Độ liên quan (Relevance): Code này có đúng với chức năng của task được giao không? Có dư thừa hay bị lệch hướng không?
2. Độ ổn định (Stability): Cấu trúc code có gọn gàng, mạch lạc, dễ đọc, dễ bảo trì không? Có dư thừa dòng không cần thiết không?
3. Mức độ rủi ro (Risk): Có rủi ro về mặt kỹ thuật hoặc thời gian không (đặc biệt nếu đẩy sát giờ/trễ hạn deadline)?

Hãy trả về kết quả chính xác theo định dạng sau (đảm bảo mỗi tiêu chí nằm trên một dòng riêng biệt bắt đầu đúng với tên tiêu chí và ngăn cách phần đánh giá/nhận xét bằng ký tự "|"):
Độ liên quan: [Thấp/Trung bình/Cao] | [Nhận xét chi tiết của bạn]
Độ ổn định: [Thấp/Trung bình/Cao] | [Nhận xét chi tiết của bạn]
Mức độ rủi ro: [Thấp/Trung bình/Cao] | [Nhận xét chi tiết của bạn]`;

    try {
      const { askGemini } = await import("../services/geminiService");
      const resText = await askGemini(userPrompt, [], {
        tasks,
        team,
        projectDetailedContext: `Dự án hiện tại có các thành viên và công việc đang theo dõi trên bảng Kanban.`
      });

      if (resText && !resText.includes("⚠️") && !resText.includes("❌")) {
        const lines = resText.split("\n");
        let parsed = { relevance: null, stability: null, risk: null };

        lines.forEach(line => {
          if (line.includes("Độ liên quan:")) {
            const parts = line.split("Độ liên quan:")[1].split("|");
            parsed.relevance = {
              level: parts[0]?.trim() || "Trung bình",
              comment: parts[1]?.trim() || "Chưa có nhận xét."
            };
          }
          if (line.includes("Độ ổn định:")) {
            const parts = line.split("Độ ổn định:")[1].split("|");
            parsed.stability = {
              level: parts[0]?.trim() || "Trung bình",
              comment: parts[1]?.trim() || "Chưa có nhận xét."
            };
          }
          if (line.includes("Mức độ rủi ro:")) {
            const parts = line.split("Mức độ rủi ro:")[1].split("|");
            parsed.risk = {
              level: parts[0]?.trim() || "Trung bình",
              comment: parts[1]?.trim() || "Chưa có nhận xét."
            };
          }
        });

        if (parsed.relevance && parsed.stability && parsed.risk) {
          if (isOnlyCommentOrTrivia) {
            parsed.relevance = {
              level: "Thấp",
              comment: `⚠️ Cảnh báo: Commit này chỉ chứa dòng comment/ghi chú thử nghiệm (ví dụ: "${addedLines[0] || "//test"}") hoặc dòng trống, chưa hề có bất kỳ mã nguồn logic xử lý thực tế nào cho tính năng "${taskName}".`
            };
            parsed.stability = {
              level: "Thấp",
              comment: "⚠️ Phát hiện mã nguồn thay đổi chỉ mang tính chất thử nghiệm/ghi chú, chưa khai báo các câu lệnh thực thi hợp lệ."
            };
            parsed.risk = {
              level: "Cao",
              comment: `⚠️ Mức rủi ro cao: Developer mới chỉ thêm dòng comment thử nghiệm mà chưa đẩy mã nguồn thực tế cho tính năng "${taskName}". Cần kiểm tra lại tiến độ.`
            };
          }

          setAiReviewResult(parsed);
          setAiReviewing(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Lỗi gọi Gemini AI, đang sử dụng thuật toán phân tích quy tắc dự phòng:", err);
    }

    setTimeout(() => {
      const isDone = selectedCommit.status === "success";
      let relLevel = "Trung bình";
      let relComment = "";
      const cleanedMsg = commitMsg.toLowerCase();
      const cleanedTask = taskName.toLowerCase();

      // 🔍 PHÂN TÍCH CHUYÊN SÂU NỘI DUNG CODE DIFF THỰC TẾ
      const addedLines = [];
      commitDiff.forEach((f) => {
        if (f.patch) {
          f.patch.split("\n").forEach((line) => {
            if (line.startsWith("+") && !line.startsWith("+++")) {
              addedLines.push(line.slice(1).trim());
            }
          });
        }
      });

      // Lọc các dòng code mới thực sự có logic (bỏ qua dòng comment //, /*, #, dòng trống, hoặc //test)
      const nonCommentAddedLines = addedLines.filter((l) => {
        if (!l) return false;
        if (l.startsWith("//") || l.startsWith("/*") || l.startsWith("*") || l.startsWith("#") || l.startsWith("<!--")) return false;
        return true;
      });

      const isOnlyCommentOrTrivia = addedLines.length > 0 && nonCommentAddedLines.length === 0;

      if (isOnlyCommentOrTrivia) {
        relLevel = "Thấp";
        relComment = `⚠️ Cảnh báo: Commit này chỉ chứa dòng comment/ghi chú thử nghiệm (ví dụ: "${addedLines[0] || "//test"}") hoặc dòng trống, chưa hề có bất kỳ mã nguồn logic xử lý thực tế nào cho tính năng "${taskName}".`;
      } else if (taskName === "Không rõ") {
        relLevel = "Trung bình";
        relComment = "Commit này không gắn kết trực tiếp với task nào trên bảng Kanban, gây khó khăn cho việc đối chiếu nghiệp vụ.";
      } else if (cleanedMsg.includes(cleanedTask) || cleanedTask.includes(cleanedMsg) || 
                 (cleanedMsg.includes("login") && cleanedTask.includes("đăng nhập")) ||
                 (cleanedMsg.includes("home") && cleanedTask.includes("trang chủ"))) {
        relLevel = "Cao";
        relComment = `Code thay đổi tập trung giải quyết chính xác tính năng "${taskName}". Logic viết gọn gàng, không phát hiện mã nguồn thừa ngoài phạm vi.`;
      } else {
        relLevel = "Thấp";
        relComment = `Tên commit "${commitMsg}" và code thay đổi có sự sai lệch nhất định so với mô tả task được giao "${taskName}". Trưởng nhóm nên xác nhận lại phạm vi code.`;
      }

      let stabLevel = isOnlyCommentOrTrivia ? "Thấp" : "Cao";
      let stabComment = isOnlyCommentOrTrivia
        ? "⚠️ Phát hiện mã nguồn thay đổi chỉ mang tính chất thử nghiệm/ghi chú, chưa khai báo các câu lệnh thực thi hợp lệ."
        : "Cấu trúc mã nguồn viết rất tường minh, khai báo biến sạch sẽ, sử dụng các framework helper chuẩn và không lạm dụng dòng code thừa.";
      
      const totalAdditions = commitDiff.reduce((sum, f) => sum + f.additions, 0);
      if (!isOnlyCommentOrTrivia) {
        if (totalAdditions > 30) {
          stabLevel = "Trung bình";
          stabComment = "Phát hiện mã nguồn thay đổi tương đối dài. Nên xem xét tách bớt các phương thức hoặc cấu trúc helper để nâng cao tính tái sử dụng.";
        } else if (totalAdditions > 80) {
          stabLevel = "Thấp";
          stabComment = "Mã nguồn quá phức tạp và dài dòng trong một commit đơn lẻ. Tiềm ẩn nguy cơ rối loạn logic điều khiển và khó bảo trì lâu dài.";
        }
      }

      let riskLevel = isOnlyCommentOrTrivia ? "Cao" : "Thấp";
      let riskComment = isOnlyCommentOrTrivia
        ? `⚠️ Mức rủi ro cao: Developer mới chỉ thêm dòng comment thử nghiệm mà chưa đẩy mã nguồn thực tế cho tính năng "${taskName}". Cần kiểm tra lại tiến độ.`
        : "Commit được đẩy lên sớm so với deadline đề ra. Các test cases tích hợp CI/CD đều vượt qua ổn định.";

      if (!isDone) {
        riskLevel = "Cao";
        riskComment = "Pipeline build CI/CD của commit này bị THẤT BẠI! Cần kiểm tra ngay log biên dịch để khắc phục lỗi cú pháp hoặc logic.";
      } else if (!isOnlyCommentOrTrivia && deadline !== "Không có") {
        const todayStr = new Date().toISOString().split("T")[0];
        if (todayStr > deadline) {
          riskLevel = "Cao";
          riskComment = `Tiến trình push code trễ so với hạn hoàn thành (Deadline: ${deadline}). Cần đẩy nhanh tiến độ review để tránh trễ hạn dây chuyền.`;
        } else if (todayStr === deadline) {
          riskLevel = "Trung bình";
          riskComment = "Code được đẩy sát giờ chót deadline. Áp lực thời gian có thể bỏ sót lỗi kiểm thử, khuyến nghị kiểm thử hộp đen kỹ càng.";
        }
      }

      setAiReviewResult({
        relevance: { level: relLevel, comment: relComment },
        stability: { level: stabLevel, comment: stabComment },
        risk: { level: riskLevel, comment: riskComment }
      });
      setAiReviewing(false);
    }, 1200);
  };

  const statusConfig = {
    success: { dot: "bg-green-500", text: "text-green-400", border: "border-green-800/40", bg: "bg-green-900/10", label: "Thành công", icon: "✓" },
    failed:  { dot: "bg-red-500",   text: "text-red-400",   border: "border-red-800/40",   bg: "bg-red-900/10",   label: "Thất bại",   icon: "✗" },
    running: { dot: "bg-yellow-500 animate-pulse", text: "text-yellow-400", border: "border-yellow-800/40", bg: "bg-yellow-900/10", label: "Đang chạy", icon: "↺" },
  };

  const totalPassed = activeCommits.reduce((s, c) => s + c.passTests, 0);
  const totalFailed = activeCommits.reduce((s, c) => s + c.failTests, 0);
  const successBuilds = activeCommits.filter((c) => c.status === "success").length;
  const failedBuilds  = activeCommits.filter((c) => c.status === "failed").length;

  return (
    <div className="space-y-5">

      {/* ─── SUMMARY CARDS ─── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng builds",    val: activeCommits.length, color: "text-blue-400",   border: "border-blue-800/40",   bg: "bg-blue-900/10" },
          { label: "Build thành công", val: successBuilds,       color: "text-green-400",  border: "border-green-800/40",  bg: "bg-green-900/10" },
          { label: "Build thất bại",   val: failedBuilds,        color: "text-red-400",    border: "border-red-800/40",    bg: "bg-red-900/10" },
          { label: "Test case pass",   val: `${totalPassed}/${totalPassed + totalFailed}`, color: "text-purple-400", border: "border-purple-800/40", bg: "bg-purple-900/10" },
        ].map((c) => (
          <div key={c.label} className={`p-4 border ${c.border} ${c.bg} rounded-2xl`}>
            <p className={`text-2xl font-black tabular-nums ${c.color}`}>{c.val}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {githubError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs">
          ⚠️ {githubError}
        </div>
      )}

      {githubLoading && (
        <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          Đang tải dữ liệu commits thật từ GitHub...
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">

        {/* ─── PIPELINE TIMELINE ─── */}
        <div className="col-span-2 bg-white dark:bg-[#0b0f1a] border border-gray-300 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-300 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Lịch sử Đẩy Code & CI/CD</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {gitUrl ? `Kho Git: ${gitUrl}` : "Kho Git: Chưa cấu hình (Thiết lập tại mục Sửa Dự Án)"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {githubCommits.length > 0 ? "Live GitHub" : "Pipeline online"}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-900 max-h-[520px] overflow-y-auto">
            {activeCommits.map((c, idx) => {
              const s = statusConfig[c.status];
              return (
                <div 
                  key={c.id} 
                  onClick={() => fetchCommitDiff(c)}
                  className={`px-5 py-3.5 hover:bg-gray-150/60 dark:hover:bg-gray-950/45 transition cursor-pointer select-none border-l-4 ${idx === 0 ? "bg-gray-50/60 dark:bg-gray-900/20 border-blue-500" : "border-transparent"}`}
                  title="Bấm để xem mã nguồn thay đổi & Đánh giá code"
                >
                  <div className="flex items-start gap-3">

                    {/* Timeline dot */}
                    <div className="flex flex-col items-center flex-shrink-0 mt-1">
                      <div className={`w-3 h-3 rounded-full ${s.dot} ring-2 ring-white dark:ring-gray-900`} />
                      {idx < activeCommits.length - 1 && <div className="w-px flex-1 bg-gray-300 dark:bg-gray-800 mt-1" style={{ minHeight: "24px" }} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Row 1: commit message + SHA */}
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.message}</p>
                        <span className="font-mono text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400">#{c.sha}</span>
                        {idx === 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-700/30 border border-blue-700/50 text-blue-400 rounded">latest</span>}
                      </div>

                      {/* Row 2: author + branch + time */}
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-indigo-700 text-white flex items-center justify-center text-[8px] font-bold">
                            {c.authorInit}
                          </div>
                          <span>{c.author}</span>
                        </div>
                        <span className="text-gray-700">•</span>
                        <span className="text-indigo-400/80">⎇ {c.branch}</span>
                        <span className="text-gray-700">•</span>
                        <span>{c.time}</span>
                        {c.relatedTask && (
                          <>
                            <span className="text-gray-700">•</span>
                            <span className="text-blue-400/70 truncate max-w-[120px]" title={c.relatedTask.name}>
                              🔗 {c.relatedTask.name.slice(0, 18)}{c.relatedTask.name.length > 18 ? "…" : ""}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Row 3: test results pipeline */}
                      <div className="flex items-center gap-2">
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border rounded-lg ${s.text} ${s.border} ${s.bg}`}>
                          <span>{s.icon}</span> {s.label}
                        </span>

                        {/* Mini test bar */}
                        <div className="flex items-center gap-1.5 flex-1">
                          <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden max-w-[120px]">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: c.totalTests > 0 ? `${(c.passTests / c.totalTests) * 100}%` : "100%" }}
                            />
                          </div>
                          <span className="text-[10px] text-green-400">{c.passTests} pass</span>
                          {c.failTests > 0 && (
                            <span className="text-[10px] text-red-400 font-semibold">{c.failTests} fail</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="flex flex-col gap-4">

          {/* Tỷ lệ build theo thành viên */}
          <div className="rounded-2xl p-4 bg-white border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Tỷ lệ thành công theo thành viên</h4>
            {team.length === 0 ? (
              <p className="text-xs text-gray-600 italic">Chưa có thành viên</p>
            ) : (
              <div className="space-y-3">
                {team.map((m) => {
                  const mCommits = commitHistory.filter((c) => c.author === m.name);
                  const mSuccess = mCommits.filter((c) => c.status === "success").length;
                  const rate = mCommits.length > 0 ? Math.round((mSuccess / mCommits.length) * 100) : 100;
                  return (
                    <div key={m.id}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-indigo-700 text-white flex items-center justify-center text-[8px] font-bold">{m.name.charAt(0)}</div>
                          <span className="text-gray-300">{m.name}</span>
                        </div>
                        <span className={rate >= 70 ? "text-green-400" : rate >= 40 ? "text-yellow-400" : "text-red-400"}>
                          {rate}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${rate >= 70 ? "bg-green-500" : rate >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${Math.max(rate, 4)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5">{mCommits.length} commits</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Failed builds */}
          <div className="rounded-2xl p-4 bg-white border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800">
            <h4 className="text-xs font-bold text-red-400 mb-3">🔴 Builds thất bại gần đây</h4>
            {commitHistory.filter((c) => c.status === "failed").length === 0 ? (
              <p className="text-xs text-gray-600 italic">Không có build thất bại. <span className="text-green-400">Xuất sắc!</span></p>
            ) : (
              <div className="space-y-2">
                {commitHistory.filter((c) => c.status === "failed").slice(0, 4).map((c) => (
                  <div key={c.id} className="p-2.5 bg-red-900/10 border border-red-800/30 rounded-xl">
                    <p className="text-xs text-red-300 font-medium truncate">{c.message.slice(0, 35)}…</p>
                    <p className="text-[10px] text-gray-500 mt-1">{c.author} • {c.failTests} test fail</p>
                    <span className="font-mono text-[9px] text-gray-600">#{c.sha}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pipeline stages legend */}
          <div className="rounded-2xl p-4 bg-white border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Các giai đoạn Pipeline</h4>
            <div className="space-y-2">
              {[
                { name: "Build & Compile", status: "success", desc: "Maven / Gradle build" },
                { name: "Unit Test",       status: successBuilds > failedBuilds ? "success" : "failed", desc: "JUnit / Jest" },
                { name: "Code Analysis",  status: "success", desc: "SonarQube / ESLint" },
                { name: "Deploy Preview", status: failedBuilds > 0 ? "failed" : "success", desc: "Staging environment" },
              ].map((stage) => {
                const s = statusConfig[stage.status];
                return (
                  <div key={stage.name} className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${stage.status === "success" ? "bg-green-500" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300">{stage.name}</p>
                      <p className="text-[10px] text-gray-600">{stage.desc}</p>
                    </div>
                    <span className={`text-[10px] font-semibold ${s.text}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      {/* ── MODAL CHI TIẾT COMMIT & ĐÁNH GIÁ CODE AI ── */}
      {selectedCommit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-[800px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-cardIn">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/5">
              <div className="flex items-center gap-3">
                <span className="text-xl">🛠️</span>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Chi tiết Commit & Phân tích Code</h3>
                  <p className="text-[10px] text-gray-500 font-mono">SHA: #{selectedCommit.sha}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCommit(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              
              {/* Commit Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800/50 p-4 rounded-2xl">
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-400">Tin nhắn commit:</p>
                  <p className="text-sm font-bold text-gray-850 dark:text-gray-200 leading-snug">{selectedCommit.message}</p>
                  {selectedCommit.relatedTask && (
                    <div className="mt-3 p-3 bg-blue-500/5 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-2xl space-y-2 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wide">📌 CÔNG VIỆC LIÊN KẾT KANBAN</p>
                          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1 leading-snug">{selectedCommit.relatedTask.name}</h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          selectedCommit.relatedTask.status === "done"   ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" :
                          selectedCommit.relatedTask.status === "doing"  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                          selectedCommit.relatedTask.status === "review" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                                                                           "bg-gray-100 text-gray-600 dark:bg-gray-850 dark:text-gray-400"
                        }`}>
                          {selectedCommit.relatedTask.status === "done"   ? "Hoàn thành" :
                           selectedCommit.relatedTask.status === "doing"  ? "Đang làm" :
                           selectedCommit.relatedTask.status === "review" ? "Xem xét" : "Chờ xử lý"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[10px] text-gray-500 dark:text-gray-400">
                        {selectedCommit.relatedTask.score && (
                          <span>⭐ Độ khó: <strong>{selectedCommit.relatedTask.score}</strong></span>
                        )}
                        {selectedCommit.relatedTask.bugCount > 0 ? (
                          <span className="text-red-500 font-medium">🐛 Lỗi: <strong>{selectedCommit.relatedTask.bugCount}</strong></span>
                        ) : null}
                        {selectedCommit.relatedTask.deadline && (
                          <span>📅 Hạn: <strong>{selectedCommit.relatedTask.deadline}</strong></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 text-right">
                  <p className="text-xs text-gray-400">Người thực hiện & Thời gian:</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-300">{selectedCommit.author}</p>
                  <p className="text-[10px] text-gray-500">{selectedCommit.time} ({selectedCommit.branch})</p>
                </div>
              </div>

              {/* Code Changes Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mã nguồn thay đổi (Code Diff)</h4>
                
                {commitDiffLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-500 italic">Đang phân tích cấu trúc mã nguồn từ repository...</p>
                  </div>
                ) : !commitDiff || commitDiff.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-4">Không tìm thấy mã nguồn thay đổi.</p>
                ) : (
                  <div className="space-y-4">
                    {commitDiff.map((file, fIdx) => (
                      <div key={fIdx} className="border border-gray-200 dark:border-gray-850 rounded-2xl overflow-hidden">
                        {/* File path header */}
                        <div className="bg-gray-50 dark:bg-black/40 px-4 py-2 text-xs font-mono font-semibold text-gray-700 dark:text-gray-400 border-b border-gray-200 dark:border-gray-850 flex items-center justify-between">
                          <span className="truncate max-w-[500px]" title={file.filename}>{file.filename}</span>
                          <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                            +{file.additions} -{file.deletions}
                          </span>
                        </div>
                        {/* Diff code content */}
                        <pre className="p-4 bg-[#080c14] text-gray-300 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed max-h-[220px] custom-scrollbar">
                          {file.patch.split("\n").map((line, lIdx) => {
                            const isAdded = line.startsWith("+") && !line.startsWith("+++");
                            const isRemoved = line.startsWith("-") && !line.startsWith("---");
                            return (
                              <div 
                                key={lIdx} 
                                className={`px-2 py-0.5 rounded ${
                                  isAdded ? "text-green-400 bg-green-950/20" : 
                                  isRemoved ? "text-red-400 bg-red-950/25" : ""
                                }`}
                              >
                                {line}
                              </div>
                            );
                          })}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Code Review Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span>✨</span> Đánh giá chất lượng bằng AI
                  </h4>
                  {!aiReviewResult && !aiReviewing && (
                    <button
                      onClick={handleAIReview}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1.5"
                    >
                      🤖 Bắt đầu Đánh giá Code
                    </button>
                  )}
                </div>

                {aiReviewing && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                    <div className="relative w-10 h-10">
                      <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <div className="absolute inset-2 bg-blue-500/10 rounded-full flex items-center justify-center text-sm">🤖</div>
                    </div>
                    <p className="text-xs text-gray-500 font-medium animate-pulse">Trợ lý AI đang chấm điểm logic code & kiểm tra thời hạn...</p>
                  </div>
                )}

                {aiReviewResult && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-3 gap-4">
                      
                      {/* Relevance Card */}
                      <div className="p-4 bg-gray-50 dark:bg-black/25 border border-gray-200 dark:border-gray-855 rounded-2xl space-y-3 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">1. Độ Liên Quan</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                            {aiReviewResult.relevance?.comment}
                          </p>
                        </div>
                        <div className="pt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                            aiReviewResult.relevance?.level === "Cao" ? "bg-green-500/10 text-green-400 border-green-500/25" :
                            aiReviewResult.relevance?.level === "Trung bình" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" :
                                                                              "bg-red-500/10 text-red-400 border-red-500/25"
                          }`}>
                            Cấp độ: {aiReviewResult.relevance?.level}
                          </span>
                        </div>
                      </div>

                      {/* Stability Card */}
                      <div className="p-4 bg-gray-50 dark:bg-black/25 border border-gray-200 dark:border-gray-855 rounded-2xl space-y-3 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">2. Độ Ổn Định</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                            {aiReviewResult.stability?.comment}
                          </p>
                        </div>
                        <div className="pt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                            aiReviewResult.stability?.level === "Cao" ? "bg-green-500/10 text-green-400 border-green-500/25" :
                            aiReviewResult.stability?.level === "Trung bình" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" :
                                                                              "bg-red-500/10 text-red-400 border-red-500/25"
                          }`}>
                            Cấp độ: {aiReviewResult.stability?.level}
                          </span>
                        </div>
                      </div>

                      {/* Risk Card */}
                      <div className="p-4 bg-gray-50 dark:bg-black/25 border border-gray-200 dark:border-gray-855 rounded-2xl space-y-3 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">3. Mức Độ Rủi Ro</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                            {aiReviewResult.risk?.comment}
                          </p>
                        </div>
                        <div className="pt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                            aiReviewResult.risk?.level === "Thấp" ? "bg-green-500/10 text-green-400 border-green-500/25" :
                            aiReviewResult.risk?.level === "Trung bình" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" :
                                                                          "bg-red-500/10 text-red-400 border-red-500/25"
                          }`}>
                            Mức rủi ro: {aiReviewResult.risk?.level}
                          </span>
                        </div>
                      </div>

                    </div>
                    <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[10px] text-gray-500 flex items-center gap-2">
                      <span>💡</span>
                      <span>Mức độ đánh giá được kết xuất dựa trên dữ liệu so khớp Git-Kanban và logic phân tích mã nguồn từ trợ lý AI.</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-gray-800/80 flex justify-end gap-2">
              {aiReviewResult && (
                <button
                  onClick={handleAIReview}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold rounded-xl transition"
                >
                  🔄 Đánh giá lại
                </button>
              )}
              <button 
                onClick={() => setSelectedCommit(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20"
              >
                Đóng phân tích
              </button>
            </div>

          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function TabPlaceholder({ label }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-600 gap-3">
      <div className="text-4xl opacity-30">🚧</div>
      <p className="text-lg font-medium text-gray-500">Tab "{label}"</p>
      <p className="text-sm">Chức năng đang được phát triển...</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   MEMBERS TAB
═══════════════════════════════════════ */
function MembersTab({ tasks, team, setTeam, projectId, isOwner, isLeader, fetchProjectAndMembers }) {
  const [emailQuery,          setEmailQuery]          = useState("");
  const [results,             setResults]             = useState([]);
  const [searching,           setSearching]           = useState(false);
  const [searchDone,          setSearchDone]          = useState(false);
  const [apiError,            setApiError]            = useState(false);
  const [showDrop,            setShowDrop]            = useState(false);
  const [inviting,            setInviting]            = useState(null);

  const [selectedMember, setSelectedMember] = useState(null);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const handleToggleRole = async (member) => {
    const currentRole = member.projectRole || "MEMBER";
    const targetRole = currentRole === "MANAGER" ? "MEMBER" : "MANAGER";
    
    setUpdatingRoleId(member.id);
    try {
      const { default: apiClient } = await import("../services/api");
      await apiClient.put(`/projects/${projectId}/members/${member.id}/role`, null, {
        params: { role: targetRole }
      });
      showToast(`Đã ${targetRole === "MANAGER" ? "nâng quyền Reviewer / Quản lý" : "hạ quyền về Thành viên"} cho ${member.name}!`);
      if (fetchProjectAndMembers) {
        await fetchProjectAndMembers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Cập nhật quyền thất bại.", "error");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleMemberClick = (member) => {
    if (!isLeader && !isOwner) {
      alert("Chỉ có Trưởng nhóm mới có quyền xem thông tin chi tiết đóng góp của thành viên!");
      return;
    }
    setSelectedMember(member);
  };
  const [removing,            setRemoving]            = useState(null);
  const [toast,               setToast]               = useState(null);
  const [pendingInvitations,  setPendingInvitations]  = useState([]);
  const [loadingPending,      setLoadingPending]      = useState(false);
  const debRef  = useRef(null);
  const dropRef = useRef(null);

  /* Fetch pending invitations của project (chỉ owner) */
  const fetchPendingInvitations = useCallback(async () => {
    if (!isOwner || !projectId) return;
    setLoadingPending(true);
    try {
      const { default: apiClient } = await import("../services/api");
      const res = await apiClient.get(`/projects/${projectId}/invitations/pending`);
      setPendingInvitations(res.data?.data ?? []);
    } catch {
      setPendingInvitations([]);
    } finally {
      setLoadingPending(false);
    }
  }, [isOwner, projectId]);

  useEffect(() => {
    fetchPendingInvitations();
  }, [fetchPendingInvitations]);

  /* Show toast */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* Debounce search */
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);

    if (emailQuery.trim().length < 2) {
      setResults([]);
      setShowDrop(false);
      setSearchDone(false);
      setApiError(false);
      return;
    }

    debRef.current = setTimeout(async () => {
      setSearching(true);
      setApiError(false);
      try {
        const { default: apiClient } = await import("../services/api");
        const res = await apiClient.get("/users/search", {
          params: { email: emailQuery.trim(), size: 5 },
        });
        const data = res.data?.data ?? [];
        const filtered = data.filter(
          (u) => !team.some((m) => String(m.id) === String(u.id))
        );
        setResults(filtered);
        setShowDrop(true);
      } catch {
        setResults([]);
        setApiError(true);
        setShowDrop(true);
      } finally {
        setSearching(false);
        setSearchDone(true);
      }
    }, 400);

    return () => clearTimeout(debRef.current);
  }, [emailQuery, team]);

  /* Click ngoài đóng dropdown */
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Gửi lời mời */
  const handleInvite = async (user) => {
    setInviting(user.email);
    try {
      const { default: apiClient } = await import("../services/api");
      await apiClient.post(`/projects/${projectId}/members`, { email: user.email });
      setEmailQuery(""); setResults([]); setShowDrop(false);
      showToast(`Đã gửi lời mời cho ${user.fullName || user.username}! Đang chờ xác nhận.`);
      await fetchPendingInvitations();
    } catch (err) {
      showToast(err.response?.data?.message || "Gửi lời mời thất bại. Vui lòng thử lại.", "error");
    } finally { setInviting(null); }
  };

  /* Xóa thành viên */
  const handleRemove = async (member) => {
    if (!window.confirm(`Xóa ${member.name} khỏi dự án?`)) return;
    setRemoving(member.id);
    try {
      const { default: apiClient } = await import("../services/api");
      await apiClient.delete(`/projects/${projectId}/members/${member.id}`);
      const updated = team.filter((m) => m.id !== member.id);
      setTeam(updated);
      localStorage.setItem("team", JSON.stringify(updated));
      showToast(`Đã xóa ${member.name} khỏi dự án.`);
    } catch (err) {
      showToast(err.response?.data?.message || "Xóa thất bại.", "error");
    } finally { setRemoving(null); }
  };

  /* Avatar màu */
  const avatarColor = (name) => {
    const colors = ["bg-blue-600","bg-purple-600","bg-green-600","bg-orange-500","bg-pink-600","bg-teal-600"];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  /* Tính stats từng thành viên */
  const memberStats = team.map((m) => {
    const myTasks = tasks.filter((t) => t.assignee?.id === m.id);
    const done    = myTasks.filter((t) => t.status === "done").length;
    const total   = myTasks.length;
    const inProgress = myTasks.filter((t) => t.status === "doing").length;
    
    const overdueCount = myTasks.filter(isTaskOverdue).length;
    const onTimeCount  = myTasks.filter(isCompletedOnTime).length;
    const contributionScore = myTasks.filter(t => t.status === "done").reduce((sum, t) => sum + (parseInt(t.score) || 0), 0);

    const bugs       = myTasks.reduce((s, t) => s + (t.bugCount || 0), 0);
    const pct        = total > 0 ? Math.round((done / total) * 100) : 0;
    const barColor   = pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-blue-500" : "bg-yellow-500";
    
    return { 
      ...m, 
      myTasks, 
      done, 
      total, 
      inProgress, 
      overdue: overdueCount,
      overdueCount,
      onTimeCount,
      contributionScore,
      bugs, 
      pct, 
      barColor 
    };
  });

  /* Summary stats */
  const totalMembers  = team.length;
  const totalDone     = memberStats.reduce((s, m) => s + m.done, 0);
  const totalTasks    = memberStats.reduce((s, m) => s + m.total, 0);
  const avgProgress   = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 relative">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thành Viên Dự Án</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-0.5">
            {totalMembers} thành viên · {avgProgress}% tiến độ trung bình
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tổng thành viên",     val: totalMembers,                          color: "text-blue-700 dark:text-blue-400",   border: "border-blue-200 dark:border-blue-800/40",   bg: "bg-blue-50/80 dark:bg-blue-900/20" },
          { label: "Tasks đã hoàn thành", val: `${totalDone}/${totalTasks}`,         color: "text-green-700 dark:text-green-400",  border: "border-green-200 dark:border-green-800/40",  bg: "bg-green-50/80 dark:bg-green-900/20" },
          { label: "Tiến độ TB",          val: `${avgProgress}%`,                    color: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800/40", bg: "bg-purple-50/80 dark:bg-purple-900/20" },
          { label: "Trễ hạn",             val: memberStats.reduce((s,m)=>s+m.overdue,0), color: "text-red-700 dark:text-red-400",    border: "border-red-200 dark:border-red-800/40",    bg: "bg-red-50/80 dark:bg-red-900/20" },
        ].map((c) => (
          <div key={c.label} className={`p-4 border ${c.border} ${c.bg} rounded-2xl shadow-sm dark:shadow-none`}>
            <p className={`text-2xl font-black tabular-nums ${c.color}`}>{c.val}</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-bold mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* INVITE — chỉ owner thấy */}
      {isOwner && (
        <div className="bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400 text-lg">＋</span>
            Mời Thành Viên Mới
          </h3>

          <div className="relative" ref={dropRef}>
            {/* Search input */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                value={emailQuery}
                onChange={(e) => { setEmailQuery(e.target.value); }}
                onFocus={() => emailQuery.trim().length >= 2 && setShowDrop(true)}
                placeholder="Nhập email để tìm kiếm thành viên..."
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 dark:bg-black dark:border-gray-700 dark:focus:border-blue-500 rounded-xl outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition shadow-sm dark:shadow-none"
              />
              {/* Spinner */}
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
              )}
              {/* Clear button */}
              {!searching && emailQuery && (
                <button
                  onClick={() => { setEmailQuery(""); setShowDrop(false); setResults([]); setSearchDone(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white text-lg leading-none transition"
                >
                  ×
                </button>
              )}
            </div>

            {/* DROPDOWN KET QUA */}
            {showDrop && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 dark:bg-[#0d1120] dark:border-gray-700/80 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/60 z-50 overflow-hidden">

                {/* Loi API */}
                {apiError && (
                  <div className="flex items-start gap-3 px-5 py-4 bg-amber-50/50 dark:bg-transparent">
                    <span className="text-xl mt-0.5">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-yellow-400">Không kết nối được tới server</p>
                      <p className="text-xs text-amber-600 dark:text-gray-500 mt-0.5">
                        Vui lòng khởi động Spring Boot rồi thử lại.
                      </p>
                    </div>
                  </div>
                )}

                {/* Khong tim thay */}
                {!apiError && searchDone && results.length === 0 && (
                  <div className="flex items-center gap-3 px-5 py-4">
                    <span className="text-xl">🔍</span>
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Không tìm thấy người dùng với email{" "}
                        <span className="text-gray-900 dark:text-white font-semibold">&ldquo;{emailQuery}&rdquo;</span>
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Kiểm tra lại email hoặc người dùng chưa đăng ký tài khoản.
                      </p>
                    </div>
                  </div>
                )}

                {/* Co ket qua */}
                {!apiError && results.length > 0 && results.map((u, idx) => (
                  <div
                    key={u.id}
                    className={`flex items-center gap-4 px-4 py-3.5 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition ${
                      idx < results.length - 1 ? "border-b border-gray-100 dark:border-gray-800/70" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-11 h-11 rounded-full ${avatarColor(u.fullName || u.username)}
                        flex items-center justify-center text-base font-bold text-white flex-shrink-0
                        shadow-md ring-2 ring-white dark:ring-black`}
                    >
                      {(u.fullName || u.username)?.charAt(0)?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {u.fullName || u.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                    </div>

                    {/* Nut + them thanh vien */}
                    <button
                      onClick={() => handleInvite(u)}
                      disabled={inviting === u.email}
                      title="Thêm vào nhóm"
                      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                        font-bold text-lg transition-all shadow-sm
                        ${
                          inviting === u.email
                            ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 hover:scale-110 active:scale-95 text-white"
                        }`}
                    >
                      {inviting === u.email ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="leading-none">＋</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PENDING INVITATIONS — chỉ owner thấy */}
      {isOwner && pendingInvitations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-700/30 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
            <span className="text-lg">⏳</span>
            Đang chờ xác nhận ({pendingInvitations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 bg-white border border-amber-200 dark:bg-[#0f1422] dark:border-amber-700/20 rounded-xl p-3.5"
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full ${avatarColor(inv.inviteeName)}
                    flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}
                >
                  {inv.inviteeName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {inv.inviteeName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{inv.inviteeEmail}</p>
                </div>
                {/* Badge */}
                <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 bg-amber-100 border border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600/40 dark:text-amber-400 rounded-full">
                  Chờ
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


      {team.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600 gap-3">
          <div className="text-5xl opacity-40 dark:opacity-20">👥</div>
          <p className="text-gray-600 dark:text-gray-500 font-medium">Chưa có thành viên nào trong dự án</p>
          {isOwner && <p className="text-sm text-gray-400">Sử dụng ô tìm kiếm phía trên để mời thành viên</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {memberStats.map((m) => (
            <div
              key={m.id}
              onClick={() => handleMemberClick(m)}
              className="bg-white border border-gray-200 hover:border-blue-500 dark:bg-[#0b0f1a] dark:border-gray-800 dark:hover:border-blue-500/50 rounded-2xl p-5 transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-[1.01] flex flex-col justify-between"
              title={isLeader || isOwner ? "Xem chi tiết đóng góp & hiệu suất" : "Thành viên dự án"}
            >
              {/* Avatar + tên + badge */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-full ${avatarColor(m.name)} flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-sm`}>
                  {m.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{m.name}</h3>
                    {m.projectRole === "OWNER" ? (
                      <span className="text-[10px] px-2 py-0.5 bg-purple-100 border border-purple-300 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-400 rounded-full font-bold">
                        👑 Trưởng nhóm
                      </span>
                    ) : m.projectRole === "MANAGER" ? (
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-100 border border-indigo-300 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 rounded-full font-bold">
                        ⭐ Reviewer / Quản lý
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 border border-gray-300 text-gray-700 dark:bg-gray-500/10 dark:border-gray-500/30 dark:text-gray-400 rounded-full font-bold">
                        👤 Thành viên
                      </span>
                    )}
                    {m.overdue > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/40 dark:border-red-700/50 dark:text-red-400 rounded-full font-bold">
                        {m.overdue} trễ hạn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">{m.email || ""}</p>
                  
                  {/* Contribution Badge */}
                  <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg text-[11px] font-bold text-blue-700 dark:text-blue-400">
                    🏆 Đóng góp: {m.contributionScore} điểm
                  </div>
                </div>

                {/* Nút xóa — chỉ owner */}
                {isOwner && m.projectRole !== "OWNER" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(m); }}
                    disabled={removing === m.id}
                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-gray-600 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="Xóa thành viên"
                  >
                    {removing === m.id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-700 dark:text-gray-300 font-bold">Tiến độ</span>
                  <span className={`font-extrabold ${
                    m.pct >= 80 ? "text-green-700 dark:text-green-400" : m.pct >= 40 ? "text-blue-700 dark:text-blue-400" : "text-amber-700 dark:text-yellow-400"
                  }`}>{m.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${m.barColor}`}
                    style={{ width: `${Math.max(m.pct, m.total > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { val: m.total,      label: "Tổng",    color: "text-gray-900 dark:text-gray-100" },
                  { val: m.done,       label: "Xong",    color: "text-green-700 dark:text-green-400" },
                  { val: m.inProgress, label: "Đang làm", color: "text-blue-700 dark:text-blue-400" },
                  { val: m.bugs,       label: "Lỗi",     color: m.bugs > 0 ? "text-red-700 dark:text-red-400" : "text-gray-500 dark:text-gray-500" },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2">
                    <p className={`text-base font-black ${s.color}`}>{s.val}</p>
                    <p className="text-[11px] text-gray-700 dark:text-gray-300 font-bold">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Task list (nếu có) */}
              {m.myTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Công việc đang phụ trách</p>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                    {m.myTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          t.status === "done"   ? "bg-green-500" :
                          t.status === "doing"  ? "bg-blue-500"  :
                          t.status === "review" ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"
                        }`} />
                        <span className={`text-xs truncate flex-1 font-medium ${
                          isOverdue(t) ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-600 dark:text-gray-400"
                        }`}>{t.name}</span>
                        {t.status === "done" && <span className="text-[10px] text-green-600 dark:text-green-500 flex-shrink-0 font-bold">✓</span>}
                        {isOverdue(t)       && <span className="text-[10px] text-red-500 dark:text-red-400 flex-shrink-0">⚠</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nút Nâng/Hạ Quyền (chỉ Owner thấy) */}
              {isOwner && m.projectRole !== "OWNER" && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleRole(m); }}
                    disabled={updatingRoleId === m.id}
                    className={`w-full py-1.5 px-3 text-xs font-bold rounded-xl transition border flex items-center justify-center gap-1.5 ${
                      m.projectRole === "MANAGER"
                        ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : "bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-600/30"
                    }`}
                    title={m.projectRole === "MANAGER" ? "Hạ quyền về Thành viên" : "Cho phép check code & kéo thả bảng Kanban"}
                  >
                    {updatingRoleId === m.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{m.projectRole === "MANAGER" ? "⬇️" : "⬆️"}</span>
                        <span>{m.projectRole === "MANAGER" ? "Hạ về Thành viên" : "Nâng làm Reviewer / Quản lý"}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* ── MODAL CHI TIẾT ĐÓNG GÓP THÀNH VIÊN ── */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-700 rounded-3xl w-[580px] shadow-2xl overflow-hidden animate-cardIn">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10">
              <div className="flex items-center gap-3">
                <span className="text-xl">📊</span>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Phân tích Hiệu suất Thành viên</h3>
                  <p className="text-[10px] text-gray-500">Dành riêng cho Quản lý / Trưởng nhóm</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMember(null)} 
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
              
              {/* Profile Overview */}
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-gray-800/50 p-4 rounded-2xl">
                <div className={`w-14 h-14 rounded-full ${avatarColor(selectedMember.name)} flex items-center justify-center text-xl font-bold text-white shadow-md flex-shrink-0`}>
                  {selectedMember.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg truncate">{selectedMember.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selectedMember.email}</p>
                  <p className="text-[10px] mt-1 inline-block px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded-full border border-indigo-100 dark:border-indigo-800/30">
                    ID: {selectedMember.id}
                  </p>
                </div>
              </div>

              {/* Performance Stats */}
              <div>
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chỉ số Hiệu suất & Đóng góp</h5>
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* Contribution Score */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100/50 dark:border-blue-900/30 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Điểm Đóng Góp</p>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono mt-2">{selectedMember.contributionScore} ★</p>
                    <p className="text-[9px] text-gray-500 mt-1">Dựa trên điểm của task đã xong</p>
                  </div>

                  {/* Tasks On Time */}
                  <div className="p-4 rounded-2xl bg-green-50/50 dark:bg-green-950/15 border border-green-100/50 dark:border-green-900/30 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Đúng Hạn</p>
                    <p className="text-2xl font-black text-green-700 dark:text-green-300 font-mono mt-2">
                      {selectedMember.onTimeCount} <span className="text-xs font-medium text-gray-500">/ {selectedMember.done} done</span>
                    </p>
                    <p className="text-[9px] text-gray-500 mt-1">
                      Tỷ lệ: {selectedMember.done > 0 ? Math.round((selectedMember.onTimeCount / selectedMember.done) * 100) : 100}%
                    </p>
                  </div>

                  {/* Tasks Overdue */}
                  <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/15 border border-red-100/50 dark:border-red-900/30 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Trễ Hạn</p>
                    <p className="text-2xl font-black text-red-700 dark:text-red-300 font-mono mt-2">{selectedMember.overdueCount} task</p>
                    <p className="text-[9px] text-gray-500 mt-1">Gồm cả task đang làm trễ hạn</p>
                  </div>

                </div>
              </div>

              {/* Tasks List Table */}
              <div>
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Danh sách công việc phụ trách ({selectedMember.myTasks.length})</h5>
                {selectedMember.myTasks.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4 text-center">Chưa được giao công việc nào.</p>
                ) : (
                  <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-gray-800">
                          <th className="p-3 font-semibold text-gray-500 dark:text-gray-400">Tên công việc</th>
                          <th className="p-3 font-semibold text-gray-500 dark:text-gray-400 text-center">Độ khó</th>
                          <th className="p-3 font-semibold text-gray-500 dark:text-gray-400 text-center">Trạng thái</th>
                          <th className="p-3 font-semibold text-gray-500 dark:text-gray-400 text-right">Đúng hạn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                        {selectedMember.myTasks.map((t) => {
                          const isDone = t.status === "done";
                          const isOver = isTaskOverdue(t);
                          const onTime = isCompletedOnTime(t);
                          return (
                            <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-all">
                              <td className="p-3 font-medium text-gray-850 dark:text-gray-250">
                                <div className="truncate max-w-[200px]" title={t.name}>{t.name}</div>
                                {t.deadline && <span className="text-[9px] text-gray-400 dark:text-gray-500 block mt-0.5">Hạn: {t.deadline}</span>}
                              </td>
                              <td className="p-3 text-center font-bold text-gray-700 dark:text-gray-300 font-mono">
                                {t.score || "—"}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  t.status === "done"   ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" :
                                  t.status === "doing"  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                                  t.status === "review" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                                                          "bg-gray-105 text-gray-600 dark:bg-gray-850 dark:text-gray-400"
                                }`}>
                                  {t.status === "done"   ? "Hoàn thành" :
                                   t.status === "doing"  ? "Đang làm" :
                                   t.status === "review" ? "Xem xét" : "Chờ xử lý"}
                                </span>
                              </td>
                              <td className="p-3 text-right font-medium">
                                {isDone ? (
                                  onTime ? (
                                    <span className="text-green-500 font-bold font-mono">✓ Đúng hạn</span>
                                  ) : (
                                    <span className="text-red-500 font-bold font-mono">✗ Trễ hạn</span>
                                  )
                                ) : (
                                  isOver ? (
                                    <span className="text-red-500 font-semibold animate-pulse">⚠ Quá hạn</span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-600">—</span>
                                  )
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800/80 flex justify-end">
              <button 
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 hover:shadow-lg active:scale-95"
              >
                Đóng phân tích
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN
═══════════════════════════════════════ */
export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const [activeTab, setActiveTab] = useState("kanban");
  const [projectName, setProjectName] = useState("");
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const currentUser = useAuthStore((s) => s.user);
  const isLeader = currentUser?.role === "PROJECT_MANAGER" || currentUser?.role === "ADMIN";

  /* Modal tạo/sửa task */
  const [modal, setModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [formName, setFormName] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formScore, setFormScore] = useState("");
  const [formBugCount, setFormBugCount] = useState("");
  const [formDeadline, setFormDeadline] = useState("");

  /* Task detail modal */
  const [detailTask, setDetailTask] = useState(null);

  /* Chatbot */
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");

  /* Custom AI Alert Dialog */
  const [aiAlert, setAiAlert] = useState(null);

  /* Add column */
  const [newCol, setNewCol] = useState(false);
  const [newColName, setNewColName] = useState("");

  const [projectDetail, setProjectDetail] = useState(null);
  const isOwner = projectDetail ? (String(projectDetail.ownerId || projectDetail.owner?.id) === String(currentUser?.id)) : true;

  const currentMemberInTeam = useMemo(() => {
    return team.find(m => String(m.id) === String(currentUser?.id));
  }, [team, currentUser]);

  const isManager = useMemo(() => {
    if (isOwner || currentUser?.role === "ADMIN" || currentUser?.role === "PROJECT_MANAGER") return true;
    return currentMemberInTeam?.projectRole === "MANAGER" || currentMemberInTeam?.projectRole === "OWNER";
  }, [isOwner, currentUser, currentMemberInTeam]);

  const gitUrl = useMemo(() => {
    return localStorage.getItem("project_git_" + id) || "";
  }, [id]);

  const [githubCommits, setGithubCommits] = useState([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState("");

  const parseGithubUrl = useCallback((url) => {
    if (!url) return null;
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith(".git")) {
      cleanUrl = cleanUrl.slice(0, -4);
    }
    const httpsMatch = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }
    const sshMatch = cleanUrl.match(/github\.com:([^\/]+)\/([^\/]+)/);
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2] };
    }
    return null;
  }, []);

  const fetchGithubCommits = useCallback(async () => {
    const githubInfo = parseGithubUrl(gitUrl);
    if (!githubInfo) {
      setGithubCommits([]);
      setGithubError("");
      return;
    }

    setGithubLoading(true);
    setGithubError("");
    try {
      const { owner, repo } = githubInfo;
      const [commitsRes, runsRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`),
        fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=20`).catch(() => null)
      ]);

      if (!commitsRes.ok) {
        throw new Error(`GitHub API returned status ${commitsRes.status}`);
      }

      const rawCommits = await commitsRes.json();
      
      let workflowRuns = [];
      if (runsRes && runsRes.ok) {
        try {
          const runsData = await runsRes.json();
          workflowRuns = runsData.workflow_runs || [];
        } catch (e) {
          console.warn("Lỗi parse JSON actions runs:", e);
        }
      }

      const mappedCommits = rawCommits.map((c, idx) => {
        const matchRun = workflowRuns.find((r) => r.head_sha === c.sha);
        
        let status = "success";
        if (matchRun) {
          if (matchRun.status === "completed") {
            status = matchRun.conclusion === "success" ? "success" : "failed";
          } else {
            status = "running";
          }
        } else {
          // Nếu không cấu hình GitHub Actions CI, tất cả commit push thành công mặc định có status "success"
          status = "success";
        }

        const passTests = status === "success" ? Math.floor(Math.random() * 20) + 15 : status === "running" ? 8 : 4;
        const failTests = status === "failed" ? Math.floor(Math.random() * 4) + 1 : 0;

        const githubLogin = c.author?.login || "";
        const gitEmail = c.commit.author?.email || "";
        const gitName = c.commit.author?.name || "";

        const matchedMember = team.find(m => 
          (m.githubUsername && githubLogin && m.githubUsername.toLowerCase() === githubLogin.toLowerCase()) ||
          (m.email && gitEmail && m.email.toLowerCase() === gitEmail.toLowerCase()) ||
          (m.fullName && gitName && m.fullName.toLowerCase() === gitName.toLowerCase()) ||
          (m.username && githubLogin && m.username.toLowerCase() === githubLogin.toLowerCase())
        );

        const authorName = matchedMember ? (matchedMember.fullName || matchedMember.name) : (c.commit.author?.name || c.author?.login || "Unknown");

        return {
          id: c.sha,
          author: authorName,
          authorInit: authorName.charAt(0).toUpperCase(),
          message: c.commit.message.split("\n")[0],
          branch: matchRun ? matchRun.head_branch : "main",
          status,
          passTests,
          failTests,
          totalTests: passTests + failTests,
          sha: c.sha.slice(0, 7),
          time: new Date(c.commit.author?.date || Date.now()).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          }),
          relatedTask: null,
          authorEmail: gitEmail,
          authorGithubLogin: githubLogin,
        };
      });

      setGithubCommits(mappedCommits);
    } catch (err) {
      console.warn("Lỗi tải GitHub commits. Sử dụng fallback giả lập.", err);
      setGithubError("Không thể kết nối đến GitHub API (kho riêng tư hoặc hết hạn mức). Đang hiển thị dữ liệu giả lập.");
      setGithubCommits([]);
    } finally {
      setGithubLoading(false);
    }
  }, [gitUrl, team, parseGithubUrl]);

  useEffect(() => {
    fetchGithubCommits();
  }, [fetchGithubCommits]);

  const commitHistory = useMemo(() => {
    const statuses = ["success", "success", "success", "failed", "running"];
    const msgs = [
      "feat: thêm chức năng xác thực người dùng",
      "fix: sửa lỗi validate form đăng nhập",
      "refactor: tách logic service layer",
      "feat: tích hợp JWT authentication",
      "fix: xử lý exception NullPointerException",
      "test: thêm unit test cho UserService",
      "feat: hoàn thiện API quản lý dự án",
      "fix: sửa lỗi ngày tháng không đúng định dạng",
      "chore: cập nhật dependencies",
      "feat: thêm drag-drop cho Kanban board",
    ];
    const branches = ["main", "develop", "feature/auth", "feature/kanban", "hotfix/login"];

    const rows = [];
    const now = Date.now();

    team.forEach((m, mi) => {
      const myTasks = tasks.filter((t) => t.assignee?.id === m.id);
      const count = Math.max(2, myTasks.length + 1);
      for (let i = 0; i < count; i++) {
        const relatedTask = myTasks[i % Math.max(myTasks.length, 1)];
        const bugCount = relatedTask?.bugCount || 0;
        const status = bugCount > 0 && i === 0
          ? "failed"
          : statuses[(mi * 3 + i) % statuses.length];
        const passTests = status === "success" ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 5);
        const failTests = status === "failed" ? bugCount || (Math.floor(Math.random() * 5) + 1) : 0;
        rows.push({
          id: `${m.id}-${i}`,
          author: m.name,
          authorInit: m.name.charAt(0),
          message: relatedTask ? `feat: ${relatedTask.name.slice(0, 40)}` : msgs[(mi * 2 + i) % msgs.length],
          branch: branches[(mi + i) % branches.length],
          status,
          passTests,
          failTests,
          totalTests: passTests + failTests,
          sha: Math.random().toString(16).slice(2, 9),
          time: new Date(now - (mi * count + i) * 1000 * 60 * 37).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }),
          relatedTask,
          authorEmail: m.email || "",
          authorGithubLogin: m.githubUsername || "",
        });
      }
    });

    if (team.length === 0) {
      for (let i = 0; i < 5; i++) {
        rows.push({
          id: `demo-${i}`,
          author: "Demo User",
          authorInit: "D",
          message: msgs[i],
          branch: branches[i % branches.length],
          status: statuses[i % statuses.length],
          passTests: 12,
          failTests: i === 1 ? 3 : 0,
          totalTests: i === 1 ? 15 : 12,
          sha: Math.random().toString(16).slice(2, 9),
          time: new Date(Date.now() - i * 1000 * 60 * 45).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }),
          relatedTask: null,
          authorEmail: "",
          authorGithubLogin: "",
        });
      }
    }

    return rows.sort((a, b) => b.id.localeCompare(a.id));
  }, [tasks, team]);

  const cleanTextNormalized = useCallback((str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const isCommitByMember = useCallback((commit, member) => {
    if (!commit || !member) return false;

    const ghLogin = (commit.authorGithubLogin || "").toLowerCase().trim();
    const gitEmail = (commit.authorEmail || "").toLowerCase().trim();
    const gitAuthor = (commit.author || "").toLowerCase().trim();

    const memGh = (member.githubUsername || "").toLowerCase().trim();
    const memEmail = (member.email || "").toLowerCase().trim();
    const memName = (member.fullName || member.name || member.username || "").toLowerCase().trim();

    // 1. Khớp theo GitHub Username
    if (memGh && ghLogin && memGh === ghLogin) return true;

    // 2. Khớp theo Email
    if (memEmail && gitEmail && memEmail === gitEmail) return true;

    // 3. Khớp theo Họ tên / Username
    if (memName && (gitAuthor === memName || (memGh && gitAuthor === memGh))) return true;

    return false;
  }, []);

  const isCommitMatchingTask = useCallback((commitMsg, taskName) => {
    if (!commitMsg || !taskName) return false;

    let msgClean = cleanTextNormalized(commitMsg);
    let taskClean = cleanTextNormalized(taskName);

    if (!msgClean || !taskClean) return false;

    // Chặn các commit chung chung không liên quan đến chức năng cụ thể
    const genericCommits = [
      "first commit", "initial commit", "init", "commit", "update", "wip", "test", "demo",
      "feat first commit", "fix first commit", "chore first commit"
    ];
    if (genericCommits.some((g) => msgClean === g || msgClean.includes("first commit") || msgClean === `feat ${g}`)) {
      return false;
    }

    // Loại bỏ tiền tố commit chuẩn
    msgClean = msgClean.replace(/^(feat|fix|chore|refactor|test|docs|style|build|ci)\s*[:\s]*/i, "").trim();

    // 1. Kiểm tra danh sách các CỤM TỪ KHÓA TÍNH NĂNG (Feature Topic Phrases) chính xác
    const FEATURE_PHRASES = [
      { key: "trang chu", syns: ["home", "homepage", "dashboard"] },
      { key: "trang ca nhan", syns: ["profile", "ca nhan", "personal"] },
      { key: "dang nhap", syns: ["login", "signin", "log in", "sign in", "auth"] },
      { key: "dang ky", syns: ["register", "signup", "sign up"] },
      { key: "nguoi dung", syns: ["user", "account"] },
      { key: "ban hang", syns: ["shop", "sales"] },
      { key: "mua hang", syns: ["cart", "checkout", "buy"] },
      { key: "hang hoa", syns: ["product", "goods", "item"] },
    ];

    // Nếu task thuộc một Feature Topic cụ thể (ví dụ "trang ca nhan"), commit BẮT BUỘC phải thuộc đúng Feature Topic đó!
    for (const f of FEATURE_PHRASES) {
      const isTaskInFeature = taskClean.includes(f.key) || f.syns.some((s) => taskClean.includes(s));
      const isMsgInFeature = msgClean.includes(f.key) || f.syns.some((s) => msgClean.includes(s));

      if (isTaskInFeature) {
        return isMsgInFeature;
      }
    }

    // 2. Nếu không thuộc các feature phrases đặc biệt trên:
    // Chuẩn hóa từ dừng (Stop Words - bao gồm từ "trang", "giao", "dien" để tránh bị khớp nhầm)
    const STOP_WORDS = new Set([
      "them", "tao", "chuc", "nang", "giao", "dien", "cho", "cua", "va", "voi", "bang", "trang",
      "feat", "fix", "chore", "refactor", "test", "docs", "style", "build", "ci", "update", "add"
    ]);

    // Chuỗi con trực tiếp nếu đủ độ dài ý nghĩa (từ 4 ký tự trở lên)
    if (msgClean.length >= 4 && taskClean.includes(msgClean)) return true;
    if (taskClean.length >= 4 && msgClean.includes(taskClean)) return true;

    // Phân tích từ khóa nòng cốt
    const taskWords = taskClean.split(" ").filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
    const msgWords = msgClean.split(" ").filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

    if (taskWords.length === 0 || msgWords.length === 0) return false;

    let matchCount = 0;
    for (let tw of taskWords) {
      if (msgWords.includes(tw)) {
        matchCount++;
      }
    }

    return matchCount > 0;
  }, [cleanTextNormalized]);

  const activeCommits = useMemo(() => {
    const list = githubCommits.length > 0 ? githubCommits : commitHistory;
    return list.map((c) => {
      if (c.relatedTask) return c;

      const matchedMember = team.find((m) => isCommitByMember(c, m));
      if (!matchedMember) return c;

      const matchedTask = tasks.find(
        (t) => t.assignee?.id === matchedMember.id && isCommitMatchingTask(c.message, t.name)
      );

      return {
        ...c,
        relatedTask: matchedTask || null,
      };
    });
  }, [githubCommits, commitHistory, tasks, team, isCommitMatchingTask, isCommitByMember]);

  const [toastMessage, setToastMessage] = useState(null);
  const [processedCommits, setProcessedCommits] = useState(() => {
    const saved = localStorage.getItem(`processed_commits_${id}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (id) {
      localStorage.setItem(`processed_commits_${id}`, JSON.stringify(processedCommits));
    }
  }, [processedCommits, id]);

  useEffect(() => {
    // CHỈ CHẠY TỰ ĐỘNG DI CHUYỂN NẾU CÓ COMMIT THẬT TỪ GITHUB API (KHÔNG DÙNG COMMIT GIẢ LẬP / DEMO)
    if (githubCommits.length === 0 || tasks.length === 0 || team.length === 0) return;

    let updatedTasks = [...tasks];
    let hasChanges = false;
    let autoMovedList = [];

    // Quét tất cả các task đang nằm ở cột "Đang thực hiện" (doing) có phân công người làm
    const doingTasks = updatedTasks.filter((t) => t.status === "doing" && t.assignee);

    doingTasks.forEach((t) => {
      // Tìm commit GitHub THẬT nào build thành công của chính người được giao task này và đúng nội dung commit
      const matchingCommit = githubCommits.find((c) => {
        if (c.status !== "success") return false;
        const isAuthor = isCommitByMember(c, t.assignee);
        const isMatchMsg = isCommitMatchingTask(c.message, t.name);
        return isAuthor && isMatchMsg;
      });

      if (matchingCommit) {
        t.status = "review";
        hasChanges = true;
        autoMovedList.push({
          taskName: t.name,
          authorName: t.assignee.fullName || t.assignee.name || t.assignee.username || "Thành viên",
          commitSha: matchingCommit.sha,
        });
      }
    });

    if (hasChanges) {
      saveTasks(updatedTasks);
      if (autoMovedList.length > 0) {
        const listText = autoMovedList
          .map(
            (item) =>
              `🤖 Đã di chuyển task "${item.taskName}" của ${item.authorName} sang cột "Đang xem xét" do tìm thấy commit GitHub #${item.commitSha} phù hợp!`
          )
          .join("\n");
        setToastMessage(listText);
        setTimeout(() => setToastMessage(null), 6000);
      }
    }
  }, [githubCommits, team, tasks, isCommitMatchingTask, isCommitByMember]);

  const fetchProjectAndMembers = useCallback(async () => {
    if (!id) return;
    try {
      const { default: apiClient } = await import("../services/api");
      
      // Fetch project detail
      const projRes = await apiClient.get(`/projects/${id}`);
      const projData = projRes.data?.data;
      if (projData) {
        setProjectDetail(projData);
        setProjectName(projData.name);
      }
      
      // Fetch members from backend
      const membersRes = await apiClient.get(`/projects/${id}/members`);
      const membersData = (membersRes.data?.data || []).map(m => ({
        ...m,
        name: m.fullName || m.name || m.username || "Thành viên"
      }));
      setTeam(membersData);
      localStorage.setItem("team", JSON.stringify(membersData));
    } catch (err) {
      console.warn("Lỗi tải thông tin dự án/thành viên từ backend:", err);
      // Fallback sang localStorage nếu API lỗi
      const projects = JSON.parse(localStorage.getItem("projects")) || [];
      const current = projects.find((p) => p.id === id);
      if (current) setProjectName(current.name);
      setTeam(JSON.parse(localStorage.getItem("team")) || []);
    }
  }, [id]);

  /* ── LOAD ── */
  useEffect(() => {
    fetchProjectAndMembers();

    // Lắng nghe sự kiện storage-update để tự động reload thành viên
    const handler = () => fetchProjectAndMembers();
    window.addEventListener("storage-update", handler);
    window.addEventListener("storage", handler);

    const tks = JSON.parse(localStorage.getItem("tasks_" + id)) || [];

    const defaultCols = [
      { id: "todo",   name: "Chờ xử lý" },
      { id: "doing",  name: "Đang thực hiện" },
      { id: "review", name: "Đang xem xét" },
      { id: "done",   name: "Hoàn thành" },
    ];
    setColumns(defaultCols);
    localStorage.setItem("columns_" + id, JSON.stringify(defaultCols));

    const validColIds = ["todo", "doing", "review", "done"];
    let hasOrphan = false;
    const sanitizedTasks = tks.map((t) => {
      if (!validColIds.includes(t.status)) {
        hasOrphan = true;
        return { ...t, status: "todo" };
      }
      return t;
    });

    if (hasOrphan) {
      localStorage.setItem("tasks_" + id, JSON.stringify(sanitizedTasks));
    }
    setTasks(sanitizedTasks);

    return () => {
      window.removeEventListener("storage-update", handler);
      window.removeEventListener("storage", handler);
    };
  }, [id, fetchProjectAndMembers]);

  /* ── SPRINT STATE & HELPERS ── */
  const [sprints, setSprints] = useState(() => {
    const saved = localStorage.getItem("sprints_" + id);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const defaultSprint = [{
      id: 1,
      name: "Sprint 1",
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      closedDate: null
    }];
    localStorage.setItem("sprints_" + id, JSON.stringify(defaultSprint));
    return defaultSprint;
  });

  const [selectedSprintId, setSelectedSprintId] = useState(() => {
    const active = sprints.find((s) => s.status === "active");
    return active ? active.id : (sprints[sprints.length - 1]?.id || 1);
  });

  const saveSprints = (data) => {
    setSprints(data);
    localStorage.setItem("sprints_" + id, JSON.stringify(data));
  };

  const activeSprint = useMemo(() => {
    return sprints.find((s) => s.status === "active") || sprints[sprints.length - 1] || { id: 1, name: "Sprint 1", status: "active" };
  }, [sprints]);

  const tasksWithSprint = useMemo(() => {
    return tasks.map((t) => {
      if (!t.sprintId) {
        return { ...t, sprintId: 1 };
      }
      return t;
    });
  }, [tasks]);

  const filteredSprintTasks = useMemo(() => {
    return tasksWithSprint.filter((t) => Number(t.sprintId || 1) === Number(selectedSprintId));
  }, [tasksWithSprint, selectedSprintId]);

  const handleCreateSprint = () => {
    if (!isManager) {
      setToastMessage("⚠️ Chỉ Trưởng nhóm và Quản lý mới có quyền tạo Sprint mới.");
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }

    const nextId = Math.max(...sprints.map((s) => s.id), 0) + 1;
    const newSprint = {
      id: nextId,
      name: `Sprint ${nextId}`,
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      closedDate: null,
    };

    const updatedSprints = sprints.map((s) => ({
      ...s,
      status: "closed",
      closedDate: s.closedDate || new Date().toISOString().split("T")[0],
    }));

    updatedSprints.push(newSprint);
    saveSprints(updatedSprints);
    setSelectedSprintId(nextId);
    setToastMessage(`✨ Đã khởi tạo và kích hoạt Sprint ${nextId}!`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleCloseSprint = (sprintToClose) => {
    if (!isManager) {
      setToastMessage("⚠️ Chỉ Trưởng nhóm và Quản lý mới có quyền đóng Sprint.");
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }

    const currentActive = sprintToClose || activeSprint;
    if (!currentActive || currentActive.status === "closed") {
      setToastMessage("⚠️ Sprint này đã đóng từ trước.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!window.confirm(`Xác nhận đóng ${currentActive.name}? Các công việc chưa hoàn thành sẽ tự động chuyển sang Sprint tiếp theo.`)) {
      return;
    }

    const nextId = Math.max(...sprints.map((s) => s.id), 0) + 1;
    const newSprint = {
      id: nextId,
      name: `Sprint ${nextId}`,
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      closedDate: null,
    };

    const updatedSprints = sprints.map((s) => {
      if (s.id === currentActive.id) {
        return { ...s, status: "closed", closedDate: new Date().toISOString().split("T")[0] };
      }
      return s;
    });
    updatedSprints.push(newSprint);

    // Chuyển các task chưa xong (todo, doing, review, blocked) sang Sprint mới
    const updatedTasks = tasks.map((t) => {
      const isThisSprint = Number(t.sprintId || 1) === Number(currentActive.id);
      if (isThisSprint && t.status !== "done") {
        return { ...t, sprintId: nextId };
      }
      return t;
    });

    saveSprints(updatedSprints);
    saveTasks(updatedTasks);
    setSelectedSprintId(nextId);
    setToastMessage(`🔒 Đã hoàn tất và đóng ${currentActive.name}. Kích hoạt Sprint ${nextId} và chuyển các task chưa hoàn thành sang Sprint mới!`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const saveTasks = (data) => { setTasks(data); localStorage.setItem("tasks_" + id, JSON.stringify(data)); };
  const saveColumns = (data) => { setColumns(data); localStorage.setItem("columns_" + id, JSON.stringify(data)); };

  /* ── TASK CRUD ── */
  const openCreate = (colId) => {
    if (!isManager) {
      setToastMessage("⚠️ Chỉ Trưởng nhóm và Quản lý mới có quyền tạo công việc.");
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }
    setEditTask({ status: colId });
    setFormName(""); setFormAssignee(""); setFormScore(""); setFormBugCount(""); setFormDeadline("");
    setModal(true);
  };

  const saveTask = () => {
    if (!formName.trim()) return;
    if (!isManager) {
      setToastMessage("⚠️ Chỉ Trưởng nhóm và Quản lý mới có quyền tạo hoặc chỉnh sửa công việc.");
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }
    const scoreVal = formScore !== "" ? Math.min(10, Math.max(1, parseInt(formScore) || 0)) : null;
    const bugVal   = formBugCount !== "" ? Math.max(0, parseInt(formBugCount) || 0) : 0;
    const assigneeObj = team.find((m) => m.id === formAssignee) || null;

    const notifyAssignee = (taskName, assignee) => {
      if (!assignee || !currentUser || !isLeader) return;
      const notifyKey = `sys_notifs_${String(assignee.id)}`;
      const existing = JSON.parse(localStorage.getItem(notifyKey) || "[]");
      existing.unshift({
        id: `task-assigned-${taskName}-${Date.now()}`,
        type: "task_assigned",
        title: "Bạn vừa được giao việc",
        message: `${currentUser.fullName || currentUser.username} đã giao cho bạn công việc "${taskName}".`,
        createdAt: Date.now(),
      });
      localStorage.setItem(notifyKey, JSON.stringify(existing));
    };

    let updated;
    if (editTask?.id) {
      const oldTask = tasks.find((t) => t.id === editTask.id);
      updated = tasks.map((t) =>
        t.id === editTask.id
          ? { 
              ...t, 
              name: formName, 
              assignee: assigneeObj, 
              score: scoreVal, 
              bugCount: bugVal, 
              deadline: formDeadline || null,
              completedAt: t.status === "done" ? (t.completedAt || new Date().toISOString().split("T")[0]) : null
            }
          : t
      );
      if (assigneeObj && oldTask?.assignee?.id !== assigneeObj.id) {
        notifyAssignee(formName, assigneeObj);
      }
    } else {
      const isDone = editTask.status === "done";
      const newTask = {
        id: Date.now().toString(),
        name: formName,
        status: editTask.status,
        sprintId: selectedSprintId || activeSprint.id || 1,
        assignee: assigneeObj,
        score: scoreVal,
        bugCount: bugVal,
        deadline: formDeadline || null,
        completedAt: isDone ? new Date().toISOString().split("T")[0] : null,
      };
      updated = [...tasks, newTask];
      if (assigneeObj) {
        notifyAssignee(formName, assigneeObj);
      }
    }
    saveTasks(updated);
    setModal(false);
  };

  const deleteTask = (task) => {
    if (!isManager) {
      setToastMessage("⚠️ Chỉ Trưởng nhóm và Quản lý mới có quyền xóa công việc.");
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }
    saveTasks(tasks.filter((t) => t.id !== task.id));
  };

  const changeAssignee = (task, member) => {
    if (!isManager) {
      setToastMessage("⚠️ Chỉ Trưởng nhóm và Quản lý mới có quyền phân công người thực hiện.");
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }
    const updated = tasks.map((t) =>
      t.id === task.id
        ? { ...t, assignee: t.assignee?.id === member.id ? null : member }
        : t
    );
    saveTasks(updated);

    if (!currentUser || !isLeader) return;
    const newAssignee = task.assignee?.id === member.id ? null : member;
    if (newAssignee) {
      const notifyKey = `sys_notifs_${String(newAssignee.id)}`;
      const existing = JSON.parse(localStorage.getItem(notifyKey) || "[]");
      existing.unshift({
        id: `task-assigned-${task.id}-${Date.now()}`,
        type: "task_assigned",
        title: "Bạn vừa được giao việc",
        message: `${currentUser.fullName || currentUser.username} đã giao cho bạn công việc "${task.name}".`,
        createdAt: Date.now(),
      });
      localStorage.setItem(notifyKey, JSON.stringify(existing));
    }
  };

  const changeScore = (task, val) => {
    if (!isManager) {
      setToastMessage("⚠️ Chỉ Trưởng nhóm và Quản lý mới có quyền chỉnh sửa điểm độ khó.");
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }
    saveTasks(tasks.map((t) => t.id === task.id ? { ...t, score: val } : t));
  };

  const openAI = (task) => {
    setChatQuestion(`Tôi cần hỗ trợ với task "${task.name}"${task.bugCount > 0 ? ` — đang có ${task.bugCount} lỗi kiểm thử` : ""}. Hãy giúp tôi phân tích vấn đề.`);
    setChatOpen(true);
  };

  const [aiSwapTask, setAiSwapTask] = useState(null);

  const handleAISwap = (task) => {
    setAiSwapTask(task);
    setActiveTab("ai");
    setToastMessage(`✨ Đã mở Trung tâm AI Hub để tư vấn hoán đổi công việc "${task.name}"!`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  /* ── COLUMN ── */
  const addColumn = () => {
    if (!isManager) {
      setToastMessage("⚠️ Chỉ Trưởng nhóm và Quản lý mới có quyền thêm cột.");
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }
    if (!newColName.trim()) return;
    saveColumns([...columns, { id: Date.now().toString(), name: newColName }]);
    setNewCol(false); setNewColName("");
  };
  const renameColumn = (colId, name) => {
    if (!isManager) return;
    saveColumns(columns.map((c) => c.id === colId ? { ...c, name } : c));
  };
  const deleteColumn = (colId) => {
    if (!isManager) {
      setToastMessage("⚠️ Chỉ Trưởng nhóm và Quản lý mới có quyền xóa cột.");
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }
    saveColumns(columns.filter((c) => c.id !== colId));
    saveTasks(tasks.filter((t) => t.status !== colId));
  };

  /* ── DRAG ── */
  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Kiểm tra quyền kéo thả của thành viên thường
    if (!isManager) {
      const isMyTask = activeTask.assignee && (String(activeTask.assignee.id) === String(currentUser?.id));
      if (!isMyTask) {
        setToastMessage("⚠️ Bạn chỉ có thể di chuyển công việc được Trưởng nhóm giao cho chính mình.");
        setTimeout(() => setToastMessage(null), 4500);
        return;
      }

      let targetColId = null;
      const overColumn = columns.find((c) => c.id === over.id);
      if (overColumn) {
        targetColId = overColumn.id;
      } else {
        const overTask = tasks.find((t) => t.id === over.id);
        if (overTask) targetColId = overTask.status;
      }

      if (activeTask.status === "todo" && targetColId === "doing") {
        saveTasks(tasks.map((t) => t.id === active.id ? { ...t, status: "doing" } : t));
        setToastMessage("✅ Đã chuyển công việc sang 'Đang thực hiện'.");
        setTimeout(() => setToastMessage(null), 4500);
        return;
      } else {
        setToastMessage("⚠️ Thành viên chỉ có thể di chuyển công việc được giao từ 'Chờ xử lý' sang 'Đang thực hiện'.");
        setTimeout(() => setToastMessage(null), 4500);
        return;
      }
    }

    const activeCol = activeTask.status;
    const overColumn = columns.find((c) => c.id === over.id);
    if (overColumn) {
      if (activeCol !== overColumn.id) {
        const isDone = overColumn.id === "done";
        saveTasks(tasks.map((t) => 
          t.id === active.id 
            ? { ...t, status: overColumn.id, completedAt: isDone ? new Date().toISOString().split("T")[0] : null } 
            : t
        ));
      }
      return;
    }
    const overTask = tasks.find((t) => t.id === over.id);
    if (!overTask) return;
    if (overTask.status !== activeCol) {
      const isDone = overTask.status === "done";
      saveTasks(tasks.map((t) => 
        t.id === active.id 
          ? { ...t, status: overTask.status, completedAt: isDone ? new Date().toISOString().split("T")[0] : null } 
          : t
      ));
      return;
    }
    const same = tasks.filter((t) => t.status === activeCol);
    const oi = same.findIndex((t) => t.id === active.id);
    const ni = same.findIndex((t) => t.id === over.id);
    if (oi === -1 || ni === -1 || oi === ni) return;
    saveTasks([...tasks.filter((t) => t.status !== activeCol), ...arrayMove(same, oi, ni)]);
  };

  const activeDragTask = tasks.find((t) => t.id === activeId);

  /* ── RENDER ── */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070a12] text-gray-900 dark:text-white flex flex-col">

      {/* HEADER */}
      <div className="flex items-center gap-4 px-6 pt-5 pb-0">
        <button onClick={() => navigate("/project")} className="text-blue-500 hover:underline text-sm">
          ← Quay lại Dự Án
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{projectName}</h1>
      </div>

      {/* TABS */}
      <div className="flex gap-0 px-4 md:px-6 mt-4 border-b border-gray-300 dark:border-gray-800 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 md:px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 p-3 md:p-6">
        {activeTab === "ai" && (
          <AIHubTab key={id} tasks={tasks} team={team} saveTasks={saveTasks} projectId={id} projectName={projectName} />
        )}

        {activeTab === "cicd" && (
          <CICDTab 
            tasks={tasks} 
            team={team} 
            projectId={id} 
            activeCommits={activeCommits} 
            githubLoading={githubLoading} 
            githubError={githubError} 
            gitUrl={gitUrl} 
            githubCommits={githubCommits} 
            commitHistory={commitHistory}
          />
        )}

        {activeTab === "report" && (
          <ReportTab tasks={tasks} team={team} projectName={projectName} activeCommits={activeCommits} />
        )}

        {activeTab === "members" && (
          <MembersTab
            tasks={tasks}
            team={team}
            setTeam={setTeam}
            projectId={id}
            isOwner={isOwner}
            isLeader={isLeader}
            fetchProjectAndMembers={fetchProjectAndMembers}
          />
        )}

        {activeTab === "kanban" && (
          <div className="space-y-4">
            {/* ── THANH QUẢN LÝ SPRINT (TRÊN BẢNG KANBAN) ── */}
            <div className="p-4 bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
              {/* Left: Sprint Selector & Info */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Danh mục Sprint:</span>
                </div>

                <select
                  value={selectedSprintId}
                  onChange={(e) => setSelectedSprintId(Number(e.target.value))}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-800 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                >
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.status === "active" ? "(Đang diễn ra)" : "(Đã đóng)"}
                    </option>
                  ))}
                </select>

                {/* Sprint Status Badge */}
                {(() => {
                  const curr = sprints.find((s) => s.id === selectedSprintId);
                  const isAct = curr?.status === "active";
                  return (
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isAct 
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 animate-pulse" 
                        : "bg-gray-500/10 text-gray-500 border-gray-500/30"
                    }`}>
                      {isAct ? "Đang diễn ra" : "Đã kết thúc"}
                    </span>
                  );
                })()}

                <span className="text-xs text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800 pl-3">
                  Số công việc: <strong>{filteredSprintTasks.length}</strong> tasks
                </span>
              </div>

              {/* Right: Actions for Leader & Manager */}
              <div className="flex items-center gap-2">
                {isManager ? (
                  <>
                    {(() => {
                      const selectedSprintObj = sprints.find((s) => s.id === selectedSprintId);
                      const canClose = selectedSprintObj && selectedSprintObj.status === "active";
                      if (canClose) {
                        return (
                          <button
                            onClick={() => handleCloseSprint(selectedSprintObj)}
                            className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            title="Đóng Sprint hiện tại và chuyển các task chưa xong sang Sprint mới"
                          >
                            Đóng {selectedSprintObj.name}
                          </button>
                        );
                      }
                      return null;
                    })()}

                    <button
                      onClick={handleCreateSprint}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                      title="Khởi tạo Sprint tiếp theo"
                    >
                      + Tạo Sprint Mới
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 italic">
                    (Chỉ Trưởng nhóm & Quản lý mới có quyền tạo / đóng Sprint)
                  </span>
                )}
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 items-start overflow-x-auto pb-4 max-w-full scrollbar-thin">

                {columns.map((col) => (
                  <Column
                    key={col.id}
                    column={col}
                    tasks={filteredSprintTasks.filter((t) => t.status === col.id)}
                    onAddTask={openCreate}
                    onRenameColumn={renameColumn}
                    onDeleteColumn={deleteColumn}
                    team={team}
                    isManager={isManager}
                    onEditTask={(t) => {
                      setEditTask(t);
                      setFormName(t.name);
                      setFormAssignee(t.assignee?.id || "");
                      setFormScore(t.score != null ? String(t.score) : "");
                      setFormBugCount(t.bugCount ? String(t.bugCount) : "");
                      setFormDeadline(t.deadline || "");
                      setModal(true);
                    }}
                    onDeleteTask={deleteTask}
                    onChangeAssignee={changeAssignee}
                    onChangeScore={changeScore}
                    onOpenAI={openAI}
                    onAISwap={handleAISwap}
                  />
                ))}

              </div>

              {/* DRAG OVERLAY */}
              <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
                {activeDragTask ? (
                  <div className="rotate-1 scale-105 shadow-2xl shadow-black/60">
                    <TaskCardContent task={activeDragTask} team={team} dragHandleProps={{}} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>

      {/* ── MODAL TẠO / SỬA CÔNG VIỆC ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-700 rounded-2xl w-[440px] shadow-2xl">
            <div className="flex justify-between items-center px-5 pt-5 pb-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-bold text-base text-gray-900 dark:text-white">
                {!isManager ? "Chi tiết công việc" : editTask?.id ? "Chỉnh sửa công việc" : "Tạo công việc"}
              </h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">✕</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Thẻ cảnh báo chỉ đọc đối với thành viên thường */}
              {!isManager && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
                  <span>Chế độ chỉ đọc. Chỉ Trưởng nhóm và Quản lý mới có quyền tạo, phân công hoặc sửa công việc.</span>
                </div>
              )}

              {/* Tên */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-400 block mb-1 font-medium">Tên công việc <span className="text-red-400">*</span></label>
                <input
                  disabled={!isManager}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && isManager && saveTask()}
                  className={`w-full p-2.5 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 rounded-xl outline-none text-sm text-gray-900 dark:text-white ${!isManager ? "opacity-75 cursor-not-allowed" : ""}`}
                  placeholder="Nhập tên công việc..."
                  autoFocus={isManager}
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-400 block mb-1 font-medium">Hạn hoàn thành</label>
                <input
                  type="date"
                  disabled={!isManager}
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  onClick={(e) => isManager && e.target.showPicker?.()}
                  className={`w-full p-2.5 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 rounded-xl outline-none text-sm text-gray-900 dark:text-white ${!isManager ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
                />
              </div>

              {/* Điểm 1-10 */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-400 block mb-1 font-medium">Điểm độ khó <span className="text-gray-500 text-xs">(1 = dễ, 10 = khó)</span></label>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button
                      key={n} type="button"
                      disabled={!isManager}
                      onClick={() => isManager && setFormScore(formScore === String(n) ? "" : String(n))}
                      className={`w-9 h-9 rounded-xl border text-sm font-medium transition
                        ${!isManager ? "opacity-75 cursor-not-allowed" : ""}
                        ${formScore === String(n)
                          ? n <= 3 ? "border-green-500 bg-green-600/20 text-green-600 dark:text-green-400 font-bold"
                            : n <= 6 ? "border-yellow-500 bg-yellow-600/20 text-yellow-600 dark:text-yellow-400 font-bold"
                            : "border-red-500 bg-red-600/20 text-red-600 dark:text-red-400 font-bold"
                          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-700 dark:text-gray-400 hover:border-gray-500"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Số lỗi kiểm thử */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-400 block mb-1 font-medium">
                  Số lỗi kiểm thử tồn đọng
                  <span className="text-gray-500 text-xs ml-1">(hiện trên thẻ nếu &gt; 0)</span>
                </label>
                <input
                  type="number" min={0}
                  disabled={!isManager}
                  value={formBugCount}
                  onChange={(e) => setFormBugCount(e.target.value)}
                  placeholder="0"
                  className={`w-32 p-2.5 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 rounded-xl outline-none text-sm text-gray-900 dark:text-white ${!isManager ? "opacity-75 cursor-not-allowed" : ""}`}
                />
              </div>

              {/* Người thực hiện */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-gray-700 dark:text-gray-400 font-medium">Người thực hiện</label>
                  {!isManager && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Chỉ Trưởng nhóm/Quản lý phân công</span>
                  )}
                </div>
                {team.length === 0
                  ? <p className="text-xs text-gray-500 italic">Chưa có thành viên nào.</p>
                  : (
                    <div className="flex flex-wrap gap-2">
                      {team.map((m) => {
                        const selected = formAssignee === m.id;
                        return (
                          <button
                            key={m.id} type="button"
                            disabled={!isManager}
                            onClick={() => isManager && setFormAssignee(selected ? "" : m.id)}
                            title={isManager ? m.name : "Chỉ Trưởng nhóm và Quản lý mới có quyền phân công người thực hiện"}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition
                              ${!isManager ? "opacity-75 cursor-not-allowed" : ""}
                              ${selected
                                ? "border-blue-500 bg-blue-600/20 text-blue-700 dark:text-white font-semibold"
                                : "border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-700 dark:text-gray-400 hover:border-gray-500"}`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                              ${selected ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
                              {m.name.charAt(0)}
                            </span>
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  )
                }
              </div>
            </div>

            {/* Footer modal */}
            <div className="flex justify-between items-center px-5 pb-5">
              <button
                onClick={() => { openAI({ name: formName || "công việc này", bugCount: parseInt(formBugCount) || 0 }); setModal(false); }}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-700/30 hover:bg-indigo-700/50 border border-indigo-600/50 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 transition"
              >
                Nhờ Trợ lý AI hỗ trợ
              </button>

              <div className="flex gap-2">
                <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">
                  {!isManager ? "Đóng" : "Hủy"}
                </button>
                {isManager && (
                  <button onClick={saveTask} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold text-white">
                    {editTask?.id ? "Lưu thay đổi" : "Tạo công việc"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHATBOT WIDGET */}
      <ChatbotWidget
        open={chatOpen}
        onClose={() => { setChatOpen(false); setChatQuestion(""); }}
        initialQuestion={chatQuestion}
      />

      {/* Nút mở chatbot nổi (khi đóng) */}
      {!chatOpen && (
        <button
          onClick={() => { setChatQuestion(""); setChatOpen(true); }}
          className="fixed bottom-6 right-6 z-[100] w-13 h-13 p-3.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-2xl hover:scale-110 transition-transform"
          title="Mở Trợ lý AI"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
        </button>
      )}

      {/* Toast thông báo AI Auto-Workflow */}
      {toastMessage && (
        <div className="fixed bottom-24 left-6 z-[200] max-w-sm p-4 bg-gradient-to-r from-blue-900 to-indigo-950 border border-blue-500 rounded-2xl shadow-2xl text-white animate-bounce-short flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">AI Auto-Workflow</h4>
            <p className="text-xs leading-relaxed whitespace-pre-line text-gray-200 font-medium">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-white text-xs transition ml-2">✕</button>
        </div>
      )}

      {/* ── CUSTOM AI ALERT DIALOG ── */}
      {aiAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] animate-fadeIn p-4">
          <div className="bg-white dark:bg-[#0b0f1a] border border-blue-200 dark:border-blue-900/50 rounded-3xl w-full max-w-[420px] shadow-2xl p-6 text-center space-y-4 animate-cardIn">
            <div className="space-y-1.5 text-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{aiAlert.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{aiAlert.message}</p>
            </div>
            <div className="pt-2">
              <button 
                onClick={() => setAiAlert(null)}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 active:scale-[0.98] outline-none"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


