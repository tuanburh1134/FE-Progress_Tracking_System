import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { askGemini } from "../services/geminiService";
import { useParams, useNavigate } from "react-router-dom";
import CICDTab from "../components/CICDTab";
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

/* ═══════════════════════════════════════
   TASK CARD CONTENT
═══════════════════════════════════════ */
function TaskCardContent({ task, team, onEdit, onDelete, onChangeAssignee, onChangeScore, onOpenAI, dragHandleProps }) {
  const [menu, setMenu] = useState(false);
  const [editScore, setEditScore] = useState(false);
  const [scoreInput, setScoreInput] = useState(task.score ?? "");

  const overdue = isOverdue(task);

  const scoreColor =
    task.score >= 8 ? "text-green-400 border-green-600" :
    task.score >= 5 ? "text-yellow-400 border-yellow-600" :
    task.score > 0  ? "text-red-400 border-red-600" :
                      "text-gray-500 border-gray-700";

  const handleScoreBlur = () => {
    const v = parseInt(scoreInput);
    const val = isNaN(v) ? null : Math.min(10, Math.max(1, v));
    setEditScore(false);
    onChangeScore?.(task, val);
  };

  return (
    <div
      {...dragHandleProps}
      className={`p-3 mb-2 bg-[#0d1117] rounded-xl transition select-none cursor-grab active:cursor-grabbing
        ${overdue
          ? "border-2 border-red-500 animate-pulse-border shadow-[0_0_8px_rgba(239,68,68,0.4)]"
          : "border border-gray-800 hover:border-gray-600"
        }`}
    >
      {/* Cảnh báo trễ hạn */}
      {overdue && (
        <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-red-500/15 border border-red-500/40 rounded-lg">
          <span className="text-red-400 text-[10px] font-bold animate-pulse">⚠ Nguy cơ trễ hạn</span>
        </div>
      )}

      {/* Row 1: tên + menu */}
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-sm leading-snug flex-1 pr-2">{task.name}</p>

        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenu(!menu); }}
            className="text-gray-500 hover:text-white px-1"
          >
            ⋯
          </button>

          {menu && (
            <div className="absolute right-0 mt-1 bg-[#111827] border border-gray-700 text-xs rounded-xl overflow-hidden z-50 shadow-lg w-32">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit?.(task); setMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-800"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenAI?.(task); setMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-blue-800 text-blue-400"
              >
                Nhờ AI hỗ trợ
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(task); setMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-red-700 text-red-400"
              >
                Xóa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Điểm + Lỗi + Avatar */}
      <div className="flex items-center gap-2">
        {/* Điểm độ khó */}
        <div
          onClick={(e) => { e.stopPropagation(); setEditScore(true); setScoreInput(task.score ?? ""); }}
          className="flex-shrink-0"
          title="Điểm độ khó (1-10)"
        >
          {editScore ? (
            <input
              autoFocus
              type="number" min={1} max={10}
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              onBlur={handleScoreBlur}
              onKeyDown={(e) => e.key === "Enter" && handleScoreBlur()}
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-6 text-center text-xs bg-black border border-blue-500 rounded-lg outline-none text-white"
            />
          ) : (
            <span
              className={`inline-flex items-center justify-center w-10 h-6 text-xs font-bold border rounded-lg cursor-pointer ${scoreColor}`}
              title="Bấm để chỉnh điểm"
            >
              {task.score != null ? task.score : "—"}
            </span>
          )}
        </div>

        {/* Nhãn lỗi kiểm thử */}
        {task.bugCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 h-6 text-[10px] font-bold border border-red-600 text-red-400 bg-red-900/20 rounded-lg flex-shrink-0">
            🐛 {task.bugCount} lỗi
          </span>
        )}

        {/* Avatar người thực hiện */}
        <div className="flex gap-1 flex-wrap justify-end ml-auto">
          {team.map((m) => {
            const active = task.assignee?.id === m.id;
            return (
              <button
                key={m.id}
                onClick={(e) => { e.stopPropagation(); onChangeAssignee?.(task, m); }}
                title={m.name}
                className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center border transition
                  ${active
                    ? "bg-blue-600 border-blue-400 text-white ring-1 ring-blue-400"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}
              >
                {m.name.charAt(0)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: tên người được giao + deadline */}
      <div className="flex items-center justify-between mt-1.5">
        {task.assignee
          ? <p className="text-[10px] text-gray-500">Giao cho: <span className="text-gray-300">{task.assignee.name}</span></p>
          : <span />
        }
        {task.deadline && (
          <span className={`text-[10px] ${overdue ? "text-red-400 font-bold" : "text-gray-600"}`}>
            {task.deadline}
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   TASK CARD — sortable wrapper
═══════════════════════════════════════ */
function TaskCard({ task, team, onEdit, onDelete, onChangeAssignee, onChangeScore, onOpenAI }) {
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
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════
   COLUMN
═══════════════════════════════════════ */
function Column({ column, tasks, onAddTask, onRenameColumn, onDeleteColumn, team, onEditTask, onDeleteTask, onChangeAssignee, onChangeScore, onOpenAI }) {
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
      <div className="p-3 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-300 dark:border-gray-800 rounded-2xl min-h-[420px] flex flex-col">
        {/* Header */}
        <div className="mb-3 flex justify-between items-center">
          {edit ? (
            <input
              value={title} autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => { setEdit(false); onRenameColumn(column.id, title); }}
              className="bg-white dark:bg-[#0b0f1a] border border-gray-300 dark:border-gray-700 px-2 py-1 rounded-lg w-full text-sm outline-none"
            />
          ) : (
            <h2 onDoubleClick={() => setEdit(true)} className="font-bold text-sm cursor-pointer">{column.name}</h2>
          )}
          <div className="relative ml-2">
            <button onClick={(e) => { e.stopPropagation(); setMenu(!menu); }} className="text-gray-500 hover:text-white px-1">⋯</button>
            {menu && (
              <div className="absolute right-0 mt-1 bg-[#111827] border border-gray-700 text-xs rounded-xl overflow-hidden z-50">
                <button onClick={() => { onDeleteColumn(column.id); setMenu(false); }} className="block px-4 py-2 hover:bg-red-700 text-red-400">Xóa cột</button>
              </div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} team={team}
              onEdit={onEditTask} onDelete={onDeleteTask}
              onChangeAssignee={onChangeAssignee}
              onChangeScore={onChangeScore}
              onOpenAI={onOpenAI}
            />
          ))}
        </SortableContext>

        {hover && (
          <button
            onClick={() => onAddTask(column.id)}
            className="mt-3 text-sm text-gray-400 hover:text-white text-left py-1 px-2 rounded-lg hover:bg-gray-800/50 transition"
          >
            + Tạo công việc
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   TABS
═══════════════════════════════════════ */
const TABS = [
  { id: "kanban",   label: "Bảng công việc (Kanban)" },
  { id: "cicd",     label: "Luồng Đẩy Code & Kiểm thử (CI/CD Git)" },
  { id: "codeLog",  label: "Nhật ký code" },
  { id: "ai",       label: "Trung tâm Trợ lý AI (AI Hub & Chatbot)" },
  { id: "report",   label: "Báo cáo & Phân tích Rủi ro" },
  { id: "members",  label: "Thành viên" },
];

/* ═══════════════════════════════════════
   AI HUB TAB
═══════════════════════════════════════ */
function AIHubTab({ tasks, team, saveTasks }) {
  const bottomRef = useRef(null);

  const [messages,        setMessages]        = useState([
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
  ]);
  const [input,           setInput]           = useState("");
  const [typing,          setTyping]          = useState(false);
  const [selectedTask,    setSelectedTask]    = useState("");
  const [reassignProposal,setReassignProposal]= useState(null);
  /** Lưu lịch sử hội thoại để gửi cho Gemini (tiết kiệm token: chỉ 4 tin nhắn cuối) */
  const chatHistory = useRef([]);

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

  /* ────────────────────────────────
     Kịch bản 2: Không thể hoàn thành — Đề xuất hoán đổi
  ──────────────────────────────── */
  const handleCannotFinish = () => {
    const task = tasks.find((t) => t.id === selectedTask);
    if (!task) {
      setMessages((p) => [...p, { from: "user", type: "text", text: "Tôi không thể hoàn thành tác vụ này đúng hạn." }]);
      pushAI({ type: "text", text: "Vui lòng chọn công việc cụ thể ở ô bên dưới trước khi gửi yêu cầu này để tôi có thể tìm người phù hợp hỗ trợ bạn." });
      return;
    }

    setMessages((p) => [...p, {
      from: "user", type: "text",
      text: `Tôi không thể hoàn thành task “${task.name}” đúng hạn.`,
    }]);

    /* Tìm thành viên nhẹ tải nhất (nhất ít task chưa done) */
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const currentAssignee = task.assignee;
      const candidates = team.filter((m) => m.id !== currentAssignee?.id);

      if (candidates.length === 0) {
        setMessages((p) => [...p, {
          from: "ai", type: "text",
          text: "Không tìm thấy thành viên khác trong nhóm. Vui lòng thêm thành viên vào nhóm trước.",
        }]);
        return;
      }

      /* Đếm số task chưa done của mỗi thành viên */
      const workload = candidates.map((m) => ({
        member: m,
        count: tasks.filter((t) => t.assignee?.id === m.id && t.status !== "done").length,
      }));
      workload.sort((a, b) => a.count - b.count);
      const best = workload[0];

      /* Tìm task nhẹ nhất của người đó để hoán đổi ngược lại */
      const swapTask = tasks.find(
        (t) => t.assignee?.id === best.member.id && t.status !== "done" && t.id !== task.id
      );

      setReassignProposal({
        fromTask: task,
        toMember: best.member,
        swapTask: swapTask || null,
        fromMember: currentAssignee,
      });

      setMessages((p) => [...p, {
        from: "ai", type: "text",
        text: `Tôi đã quét toàn bộ ${team.length} thành viên. **${best.member.name}** đang có khối lượng nhẹ nhất (${best.count} task). Xem đề xuất hoán đổi bên dưới.`,
      }]);
    }, 2000);
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
      const aiText = await askGemini(text, chatHistory.current, { tasks, team });
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
    <div className="h-full flex gap-5" style={{ minHeight: "calc(100vh - 160px)" }}>

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
      <div className="w-72 flex flex-col gap-4">

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
function ReportTab({ tasks, team, projectName }) {

  /* ── Risk Score algorithm ── */
  const riskScore = useMemo(() => {
    if (tasks.length === 0) return 0;
    const overdueCount = tasks.filter(isOverdue).length;
    const totalBugs    = tasks.reduce((s, t) => s + (t.bugCount || 0), 0);
    const doneRatio    = tasks.filter((t) => t.status === "done").length / tasks.length;
    const unassigned   = tasks.filter((t) => !t.assignee && t.status !== "done").length;
    const r =
      (overdueCount / Math.max(tasks.length, 1)) * 30 +
      Math.min(totalBugs * 3, 25) +
      (1 - doneRatio) * 15 +
      (unassigned / Math.max(tasks.length, 1)) * 15;
    return Math.min(100, Math.round(r));
  }, [tasks]);

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
    const myTasks   = tasks.filter((t) => t.assignee?.id === m.id);
    const done      = myTasks.filter((t) => t.status === "done").length;
    const totalBugs = myTasks.reduce((s, t) => s + (t.bugCount || 0), 0);
    const commits   = Math.max(1, done * 3 + myTasks.length * 2);
    const failRate  = myTasks.length > 0 ? Math.round((totalBugs / Math.max(myTasks.length * 2, 1)) * 100) : 0;
    return {
      name:     m.name.length > 9 ? m.name.slice(0, 9) + "…" : m.name,
      fullName: m.name,
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
   MOCK CI/CD TAB (Luồng Đẩy Code & Kiểm thử (CI/CD Git))
═══════════════════════════════════════ */
function MockCICDTab({ tasks, team }) {
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
        });
      }
    }

    return rows.sort((a, b) => b.id.localeCompare(a.id));
  }, [tasks, team]);

  const statusConfig = {
    success: { dot: "bg-green-500", text: "text-green-400", border: "border-green-800/40", bg: "bg-green-900/10", label: "Thành công", icon: "✓" },
    failed:  { dot: "bg-red-500",   text: "text-red-400",   border: "border-red-800/40",   bg: "bg-red-900/10",   label: "Thất bại",   icon: "✗" },
    running: { dot: "bg-yellow-500 animate-pulse", text: "text-yellow-400", border: "border-yellow-800/40", bg: "bg-yellow-900/10", label: "Đang chạy", icon: "↺" },
  };

  const totalPassed = commitHistory.reduce((s, c) => s + c.passTests, 0);
  const totalFailed = commitHistory.reduce((s, c) => s + c.failTests, 0);
  const successBuilds = commitHistory.filter((c) => c.status === "success").length;
  const failedBuilds  = commitHistory.filter((c) => c.status === "failed").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng builds",    val: commitHistory.length, color: "text-blue-400",   border: "border-blue-800/40",   bg: "bg-blue-900/10" },
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

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white dark:bg-[#0b0f1a] border border-gray-300 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-300 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Lịch sử Đẩy Code & CI/CD</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Pipeline tự động chạy test sau mỗi commit</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Pipeline online</span>
            </div>
          </div>

          <div className="divide-y divide-gray-900 max-h-[520px] overflow-y-auto">
            {commitHistory.map((c, idx) => {
              const s = statusConfig[c.status];
              return (
                <div key={c.id} className={`px-5 py-3.5 hover:bg-gray-100 dark:hover:bg-gray-900/30 transition ${idx === 0 ? "bg-gray-100 dark:bg-gray-900/20" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center flex-shrink-0 mt-1">
                      <div className={`w-3 h-3 rounded-full ${s.dot} ring-2 ring-white dark:ring-gray-900`} />
                      {idx < commitHistory.length - 1 && <div className="w-px flex-1 bg-gray-300 dark:bg-gray-800 mt-1" style={{ minHeight: "24px" }} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.message}</p>
                        <span className="font-mono text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400">#{c.sha}</span>
                        {idx === 0 && <span className="text-[10px] px-1.5 py-0.5 bg-blue-700/30 border border-blue-700/50 text-blue-400 rounded">latest</span>}
                      </div>

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

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border rounded-lg ${s.text} ${s.border} ${s.bg}`}>
                          <span>{s.icon}</span> {s.label}
                        </span>

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

        <div className="flex flex-col gap-4">
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
function MembersTab({ tasks, team, setTeam, projectId, isOwner }) {
  const [emailQuery, setEmailQuery] = useState("");
  const [results,    setResults]    = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [searchDone, setSearchDone] = useState(false); // đã search xong chưa
  const [apiError,   setApiError]   = useState(false); // backend chưa chạy?
  const [showDrop,   setShowDrop]   = useState(false);
  const [inviting,   setInviting]   = useState(null);
  const [removing,   setRemoving]   = useState(null);
  const [toast,      setToast]      = useState(null);
  const debRef  = useRef(null);
  const dropRef = useRef(null);

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
        // Loại bỏ những người đã là thành viên
        const filtered = data.filter(
          (u) => !team.some((m) => String(m.id) === String(u.id))
        );
        setResults(filtered);
        setShowDrop(true); // luôn show — kể cả khi rỗng (hiển "không tìm thấy")
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

  /* Mời thành viên */
  const handleInvite = async (user) => {
    setInviting(user.email);
    try {
      const { default: apiClient } = await import("../services/api");
      await apiClient.post(`/projects/${projectId}/members`, { email: user.email });
      const newMember = { id: String(user.id), name: user.fullName || user.username, email: user.email };
      const updated = [...team, newMember];
      setTeam(updated);
      localStorage.setItem("team", JSON.stringify(updated));
      setEmailQuery(""); setResults([]); setShowDrop(false);
      showToast(`Đã mời ${user.fullName || user.username} vào dự án!`);
    } catch (err) {
      showToast(err.response?.data?.message || "Mời thất bại. Vui lòng thử lại.", "error");
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
    const overdue    = myTasks.filter(isOverdue).length;
    const bugs       = myTasks.reduce((s, t) => s + (t.bugCount || 0), 0);
    const pct        = total > 0 ? Math.round((done / total) * 100) : 0;
    const barColor   = pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-blue-500" : "bg-yellow-500";
    return { ...m, myTasks, done, total, inProgress, overdue, bugs, pct, barColor };
  });

  /* Summary stats */
  const totalMembers  = team.length;
  const totalDone     = memberStats.reduce((s, m) => s + m.done, 0);
  const totalTasks    = memberStats.reduce((s, m) => s + m.total, 0);
  const avgProgress   = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 relative">

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl animate-fadeIn flex items-center gap-2 ${
          toast.type === "error"
            ? "bg-red-900 border border-red-700 text-red-200"
            : "bg-green-900 border border-green-700 text-green-200"
        }`}>
          {toast.type === "error" ? "✗" : "✓"} {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Thành Viên Dự Án</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalMembers} thành viên · {avgProgress}% tiến độ trung bình
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng thành viên",  val: totalMembers,  color: "text-blue-400",   border: "border-blue-800/40",   bg: "bg-blue-900/10" },
          { label: "Tasks đã hoàn thành", val: `${totalDone}/${totalTasks}`, color: "text-green-400",  border: "border-green-800/40",  bg: "bg-green-900/10" },
          { label: "Tiến độ TB",       val: `${avgProgress}%`, color: "text-purple-400", border: "border-purple-800/40", bg: "bg-purple-900/10" },
          { label: "Trễ hạn",          val: memberStats.reduce((s,m)=>s+m.overdue,0), color: "text-red-400", border: "border-red-800/40", bg: "bg-red-900/10" },
        ].map((c) => (
          <div key={c.label} className={`p-4 border ${c.border} ${c.bg} rounded-2xl`}>
            <p className={`text-2xl font-black tabular-nums ${c.color}`}>{c.val}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

           {/* INVITE — chỉ owner thấy */}
      {isOwner && (
        <div className="bg-white border border-gray-200 dark:bg-[#0b0f1a] dark:border-gray-800 rounded-2xl p-5">
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

      {/* MEMBERS GRID */}
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
              className="bg-white border border-gray-200 hover:border-blue-400 dark:bg-[#0b0f1a] dark:border-gray-800 dark:hover:border-blue-500/50 rounded-2xl p-5 transition-all shadow-sm dark:shadow-none"
            >
              {/* Avatar + tên + badge */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-full ${avatarColor(m.name)} flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-sm`}>
                  {m.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{m.name}</h3>
                    {m.overdue > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-700/50 dark:text-red-400 rounded-full font-bold">
                        {m.overdue} trễ hạn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{m.email || ""}</p>
                </div>

                {/* Nút xóa — chỉ owner */}
                {isOwner && (
                  <button
                    onClick={() => handleRemove(m)}
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
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Tiến độ</span>
                  <span className={`font-bold ${
                    m.pct >= 80 ? "text-green-600 dark:text-green-400" : m.pct >= 40 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-yellow-400"
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
                  { val: m.total,      label: "Tổng",    color: "text-gray-800 dark:text-gray-300" },
                  { val: m.done,       label: "Xong",    color: "text-green-600 dark:text-green-400" },
                  { val: m.inProgress, label: "Đang làm", color: "text-blue-600 dark:text-blue-400" },
                  { val: m.bugs,       label: "Lỗi",     color: m.bugs > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-600" },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-transparent rounded-xl py-2">
                    <p className={`text-base font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-600 font-medium">{s.label}</p>
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
            </div>
          ))}
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
  const [projectObj, setProjectObj] = useState(null);
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

  /* Add column */
  const [newCol, setNewCol] = useState(false);
  const [newColName, setNewColName] = useState("");

  /* ── LOAD ── */
  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const current = projects.find((p) => String(p.id) === String(id));
    if (current) {
      setProjectName(current.name);
      setProjectObj(current);
    }

    const loadProjectFromApi = async () => {
      try {
        const { default: apiClient } = await import("../services/api");
        const res = await apiClient.get(`/projects/${id}`);
        const data = res.data?.data;
        if (data) {
          setProjectObj(data);
          setProjectName(data.name);
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết dự án từ API:", err);
      }
    };
    loadProjectFromApi();

    const cols = JSON.parse(localStorage.getItem("columns_" + id)) || [];
    const tks  = JSON.parse(localStorage.getItem("tasks_" + id)) || [];

    if (cols.length === 0) {
      const init = [
        { id: "todo",   name: "Chờ xử lý" },
        { id: "doing",  name: "Đang thực hiện" },
        { id: "review", name: "Đang xem xét" },
        { id: "done",   name: "Hoàn thành" },
      ];
      setColumns(init);
      localStorage.setItem("columns_" + id, JSON.stringify(init));
    } else {
      setColumns(cols);
    }
    setTasks(tks);
    setTeam(JSON.parse(localStorage.getItem("team")) || []);
  }, [id]);

  const saveTasks = (data) => { setTasks(data); localStorage.setItem("tasks_" + id, JSON.stringify(data)); };
  const saveColumns = (data) => { setColumns(data); localStorage.setItem("columns_" + id, JSON.stringify(data)); };

  /* ── TASK CRUD ── */
  const openCreate = (colId) => {
    setEditTask({ status: colId });
    setFormName(""); setFormAssignee(""); setFormScore(""); setFormBugCount(""); setFormDeadline("");
    setModal(true);
  };

  const saveTask = () => {
    if (!formName.trim()) return;
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
          ? { ...t, name: formName, assignee: assigneeObj, score: scoreVal, bugCount: bugVal, deadline: formDeadline || null }
          : t
      );
      if (assigneeObj && oldTask?.assignee?.id !== assigneeObj.id) {
        notifyAssignee(formName, assigneeObj);
      }
    } else {
      const newTask = {
        id: Date.now().toString(),
        name: formName,
        status: editTask.status,
        assignee: assigneeObj,
        score: scoreVal,
        bugCount: bugVal,
        deadline: formDeadline || null,
      };
      updated = [...tasks, newTask];
      if (assigneeObj) {
        notifyAssignee(formName, assigneeObj);
      }
    }
    saveTasks(updated);
    setModal(false);
  };

  const deleteTask = (task) => saveTasks(tasks.filter((t) => t.id !== task.id));

  const changeAssignee = (task, member) => {
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

  const changeScore = (task, val) => saveTasks(tasks.map((t) => t.id === task.id ? { ...t, score: val } : t));

  const openAI = (task) => {
    setChatQuestion(`Tôi cần hỗ trợ với task "${task.name}"${task.bugCount > 0 ? ` — đang có ${task.bugCount} lỗi kiểm thử` : ""}. Hãy giúp tôi phân tích vấn đề.`);
    setChatOpen(true);
  };

  /* ── COLUMN ── */
  const addColumn = () => {
    if (!newColName.trim()) return;
    saveColumns([...columns, { id: Date.now().toString(), name: newColName }]);
    setNewCol(false); setNewColName("");
  };
  const renameColumn = (colId, name) => saveColumns(columns.map((c) => c.id === colId ? { ...c, name } : c));
  const deleteColumn = (colId) => { saveColumns(columns.filter((c) => c.id !== colId)); saveTasks(tasks.filter((t) => t.status !== colId)); };

  /* ── DRAG ── */
  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;
    const activeCol = activeTask.status;
    const overColumn = columns.find((c) => c.id === over.id);
    if (overColumn) {
      if (activeCol !== overColumn.id) saveTasks(tasks.map((t) => t.id === active.id ? { ...t, status: overColumn.id } : t));
      return;
    }
    const overTask = tasks.find((t) => t.id === over.id);
    if (!overTask) return;
    if (overTask.status !== activeCol) {
      saveTasks(tasks.map((t) => t.id === active.id ? { ...t, status: overTask.status } : t));
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
      <div className="flex gap-0 px-6 mt-4 border-b border-gray-300 dark:border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
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
      <div className="flex-1 p-6">
        {activeTab === "ai" && (
          <AIHubTab tasks={tasks} team={team} saveTasks={saveTasks} />
        )}

        {activeTab === "cicd" && (
          <MockCICDTab tasks={tasks} team={team} />
        )}

        {activeTab === "codeLog" && (
          <CICDTab tasks={tasks} team={team} project={projectObj} />
        )}

        {activeTab === "report" && (
          <ReportTab tasks={tasks} team={team} projectName={projectName} />
        )}

        {activeTab === "members" && (
          <MembersTab
            tasks={tasks}
            team={team}
            setTeam={setTeam}
            projectId={id}
            isOwner={true}
          />
        )}

        {activeTab === "kanban" && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 items-start overflow-x-auto pb-4">

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
                />
              ))}

              {/* ADD COLUMN */}
              <div className="w-[280px] flex-shrink-0">
                {newCol ? (
                  <div className="bg-white dark:bg-[#0b0f1a] border border-gray-300 dark:border-gray-700 p-3 rounded-2xl">
                    <input
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addColumn()}
                      className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-2 py-1.5 mb-3 rounded-lg text-sm outline-none"
                      placeholder="Tên cột..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={addColumn} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm">Thêm</button>
                      <button onClick={() => setNewCol(false)} className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm">Hủy</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewCol(true)}
                    className="w-10 h-10 rounded-full border border-gray-600 text-xl flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-400 transition"
                  >
                    +
                  </button>
                )}
              </div>
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
        )}
      </div>

      {/* ── MODAL TẠO / SỬA CÔNG VIỆC ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0b0f1a] border border-gray-300 dark:border-gray-700 rounded-2xl w-[440px] shadow-2xl">
            <div className="flex justify-between items-center px-5 pt-5 pb-4 border-b border-gray-800">
              <h2 className="font-bold text-base">{editTask?.id ? "Chỉnh sửa công việc" : "Tạo công việc"}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Tên */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Tên công việc <span className="text-red-400">*</span></label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveTask()}
                  className="w-full p-2.5 bg-black border border-gray-700 focus:border-blue-500 rounded-xl outline-none text-sm text-white"
                  placeholder="Nhập tên công việc..."
                  autoFocus
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Hạn hoàn thành</label>
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full p-2.5 bg-black border border-gray-700 focus:border-blue-500 rounded-xl outline-none text-sm text-white cursor-pointer"
                />
              </div>

              {/* Điểm 1-10 */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Điểm độ khó <span className="text-gray-600 text-xs">(1 = dễ, 10 = khó)</span></label>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button
                      key={n} type="button"
                      onClick={() => setFormScore(formScore === String(n) ? "" : String(n))}
                      className={`w-9 h-9 rounded-xl border text-sm font-medium transition
                        ${formScore === String(n)
                          ? n <= 3 ? "border-green-500 bg-green-600/20 text-green-400"
                            : n <= 6 ? "border-yellow-500 bg-yellow-600/20 text-yellow-400"
                            : "border-red-500 bg-red-600/20 text-red-400"
                          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-700 dark:text-gray-400 hover:border-gray-500"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Số lỗi kiểm thử */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Số lỗi kiểm thử tồn đọng
                  <span className="text-gray-600 text-xs ml-1">(hiện trên thẻ nếu &gt; 0)</span>
                </label>
                <input
                  type="number" min={0}
                  value={formBugCount}
                  onChange={(e) => setFormBugCount(e.target.value)}
                  placeholder="0"
                  className="w-32 p-2.5 bg-black border border-gray-700 focus:border-blue-500 rounded-xl outline-none text-sm text-white"
                />
              </div>

              {/* Người thực hiện */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Người thực hiện</label>
                {team.length === 0
                  ? <p className="text-xs text-gray-600 italic">Chưa có thành viên nào.</p>
                  : (
                    <div className="flex flex-wrap gap-2">
                      {team.map((m) => {
                        const selected = formAssignee === m.id;
                        return (
                          <button
                            key={m.id} type="button"
                            onClick={() => setFormAssignee(selected ? "" : m.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition
                              ${selected
                                ? "border-blue-500 bg-blue-600/20 text-white"
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
                className="flex items-center gap-2 px-3 py-2 bg-indigo-700/30 hover:bg-indigo-700/50 border border-indigo-600/50 rounded-xl text-xs text-indigo-300 transition"
              >
                ✨ Nhờ Trợ lý AI hỗ trợ
              </button>

              <div className="flex gap-2">
                <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Hủy</button>
                <button onClick={saveTask} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold">
                  {editTask?.id ? "Lưu thay đổi" : "Tạo công việc"}
                </button>
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
    </div>
  );
}


