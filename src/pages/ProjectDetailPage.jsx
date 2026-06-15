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

/* â”€â”€â”€ helpers â”€â”€â”€ */
const isOverdue = (task) => {
  if (!task.deadline || task.status === "done") return false;
  const today = new Date().toISOString().split("T")[0];
  return task.deadline <= today;
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CHATBOT WIDGET (gÃ³c pháº£i mÃ n hÃ¬nh)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ChatbotWidget({ open, onClose, initialQuestion }) {
  const [messages, setMessages] = useState([
    { from: "ai", text: "Xin chÃ o! TÃ´i lÃ  Trá»£ lÃ½ AI. TÃ´i cÃ³ thá»ƒ giÃºp gÃ¬ cho báº¡n?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (initialQuestion) {
      setMessages([
        { from: "ai", text: "Xin chÃ o! TÃ´i lÃ  Trá»£ lÃ½ AI. TÃ´i cÃ³ thá»ƒ giÃºp gÃ¬ cho báº¡n?" },
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
        text: `TÃ´i Ä‘Ã£ ghi nháº­n váº¥n Ä‘á»: "${q}". Dá»±a trÃªn dá»¯ liá»‡u dá»± Ã¡n, tÃ´i gá»£i Ã½ báº¡n kiá»ƒm tra láº¡i logic xá»­ lÃ½ vÃ  xem xÃ©t tÃ¡i cáº¥u trÃºc module liÃªn quan. Báº¡n cÃ³ muá»‘n tÃ´i phÃ¢n tÃ­ch sÃ¢u hÆ¡n khÃ´ng?`,
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
    <div className="fixed bottom-6 right-6 z-[200] w-80 flex flex-col bg-[#0b0f1a] border border-blue-700/50 rounded-2xl shadow-2xl shadow-blue-900/30 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-blue-900/40 to-indigo-900/20 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-bold text-white">Trá»£ lÃ½ AI</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">âœ•</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 max-h-64 min-h-[160px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${
              m.from === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-200"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-400 px-3 py-2 rounded-xl text-xs flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>â—</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>â—</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>â—</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 px-3 pb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Nháº­p cÃ¢u há»i..."
          className="flex-1 bg-black border border-gray-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
        />
        <button
          onClick={send}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-xl transition"
        >
          Gá»­i
        </button>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TASK CARD CONTENT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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
      {/* Cáº£nh bÃ¡o trá»… háº¡n */}
      {overdue && (
        <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-red-500/15 border border-red-500/40 rounded-lg">
          <span className="text-red-400 text-[10px] font-bold animate-pulse">âš  Nguy cÆ¡ trá»… háº¡n</span>
        </div>
      )}

      {/* Row 1: tÃªn + menu */}
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-sm leading-snug flex-1 pr-2">{task.name}</p>

        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenu(!menu); }}
            className="text-gray-500 hover:text-white px-1"
          >
            â‹¯
          </button>

          {menu && (
            <div className="absolute right-0 mt-1 bg-[#111827] border border-gray-700 text-xs rounded-xl overflow-hidden z-50 shadow-lg w-32">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit?.(task); setMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-800"
              >
                Chá»‰nh sá»­a
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenAI?.(task); setMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-blue-800 text-blue-400"
              >
                Nhá» AI há»— trá»£
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(task); setMenu(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-red-700 text-red-400"
              >
                XÃ³a
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Äiá»ƒm + Lá»—i + Avatar */}
      <div className="flex items-center gap-2">
        {/* Äiá»ƒm Ä‘á»™ khÃ³ */}
        <div
          onClick={(e) => { e.stopPropagation(); setEditScore(true); setScoreInput(task.score ?? ""); }}
          className="flex-shrink-0"
          title="Äiá»ƒm Ä‘á»™ khÃ³ (1-10)"
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
              title="Báº¥m Ä‘á»ƒ chá»‰nh Ä‘iá»ƒm"
            >
              {task.score != null ? task.score : "â€”"}
            </span>
          )}
        </div>

        {/* NhÃ£n lá»—i kiá»ƒm thá»­ */}
        {task.bugCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 h-6 text-[10px] font-bold border border-red-600 text-red-400 bg-red-900/20 rounded-lg flex-shrink-0">
            ðŸ› {task.bugCount} lá»—i
          </span>
        )}

        {/* Avatar ngÆ°á»i thá»±c hiá»‡n */}
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

      {/* Row 3: tÃªn ngÆ°á»i Ä‘Æ°á»£c giao + deadline */}
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TASK CARD â€” sortable wrapper
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   COLUMN
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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
      <div className="p-3 bg-[#0b0f1a] border border-gray-800 rounded-2xl min-h-[420px] flex flex-col">
        {/* Header */}
        <div className="mb-3 flex justify-between items-center">
          {edit ? (
            <input
              value={title} autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => { setEdit(false); onRenameColumn(column.id, title); }}
              className="bg-black border border-gray-600 px-2 py-1 rounded-lg w-full text-sm outline-none"
            />
          ) : (
            <h2 onDoubleClick={() => setEdit(true)} className="font-bold text-sm cursor-pointer">{column.name}</h2>
          )}
          <div className="relative ml-2">
            <button onClick={(e) => { e.stopPropagation(); setMenu(!menu); }} className="text-gray-500 hover:text-white px-1">â‹¯</button>
            {menu && (
              <div className="absolute right-0 mt-1 bg-[#111827] border border-gray-700 text-xs rounded-xl overflow-hidden z-50">
                <button onClick={() => { onDeleteColumn(column.id); setMenu(false); }} className="block px-4 py-2 hover:bg-red-700 text-red-400">XÃ³a cá»™t</button>
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
            + Táº¡o cÃ´ng viá»‡c
          </button>
        )}
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TABS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const TABS = [
  { id: "kanban",   label: "Báº£ng cÃ´ng viá»‡c (Kanban)" },
  { id: "cicd",     label: "Luá»“ng Äáº©y Code & Kiá»ƒm thá»­ (CI/CD Git)" },
  { id: "ai",       label: "Trung tÃ¢m Trá»£ lÃ½ AI (AI Hub & Chatbot)" },
  { id: "report",   label: "BÃ¡o cÃ¡o & PhÃ¢n tÃ­ch Rá»§i ro" },
  { id: "members",  label: "ThÃ nh viÃªn" },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   AI HUB TAB
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function AIHubTab({ tasks, team, saveTasks }) {
  const bottomRef = useRef(null);

  const [messages,        setMessages]        = useState([
    {
      from: "ai",
      type: "text",
      text: [
        "âœ¨ Xin chÃ o! TÃ´i lÃ  **Trá»£ lÃ½ AI Gemini** cá»§a dá»± Ã¡n.",
        "TÃ´i cÃ³ thá»ƒ giÃºp báº¡n:",
        "â€¢ PhÃ¢n tÃ­ch vÃ  gá»£i Ã½ sá»­a lá»—i code",
        "â€¢ Äiá»u phá»‘i cÃ´ng viá»‡c khi trá»… háº¡n",
        "â€¢ Äá» xuáº¥t hoÃ¡n Ä‘á»•i task giá»¯a cÃ¡c thÃ nh viÃªn",
        "â€¢ Tráº£ lá»i báº¥t ká»³ cÃ¢u há»i nÃ o vá» dá»± Ã¡n!",
      ].join("\n"),
    },
  ]);
  const [input,           setInput]           = useState("");
  const [typing,          setTyping]          = useState(false);
  const [selectedTask,    setSelectedTask]    = useState("");
  const [reassignProposal,setReassignProposal]= useState(null);
  /** LÆ°u lá»‹ch sá»­ há»™i thoáº¡i Ä‘á»ƒ gá»­i cho Gemini (tiáº¿t kiá»‡m token: chá»‰ 4 tin nháº¯n cuá»‘i) */
  const chatHistory = useRef([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, reassignProposal]);

  /* â€” Typing indicator rá»“i thÃªm tin AI â€” */
  const pushAI = (msgObj, delay = 1200) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((p) => [...p, { from: "ai", ...msgObj }]);
    }, delay);
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Ká»‹ch báº£n 1: Sá»­a lá»—i code
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleAnalyzeBug = () => {
    const task = tasks.find((t) => t.id === selectedTask);
    if (!task) return;

    setMessages((p) => [
      ...p,
      { from: "user", type: "text", text: `PhÃ¢n tÃ­ch lá»—i kiá»ƒm thá»­ cho task: "${task.name}" (${task.bugCount || 0} lá»—i)` },
    ]);

    pushAI({
      type: "code",
      title: `PhÃ¢n tÃ­ch lá»—i: "${task.name}"`,
      body: `TÃ´i Ä‘Ã£ Ä‘á»c lá»‹ch sá»­ commit vÃ  phÃ¡t hiá»‡n lá»—i táº¡i service liÃªn quan:

**Lá»—i phÃ¡t hiá»‡n:** Sai Ä‘á»‹nh dáº¡ng xá»­ lÃ½ dá»¯ liá»‡u á»Ÿ mÃ´-Ä‘un "${task.name}"

**CÃ¢u lá»‡nh lá»—i (dÃ²ng 45):**`,
      codeBefore: `// SAI - Dá»¯ liá»‡u chÆ°a Ä‘Æ°á»£c validate
public void process(String input) {
    Date d = new SimpleDateFormat("dd/MM/yyyy").parse(input);
    repository.save(new Record(d, input));
}`,
      codeAfter: `// ÄÃƒ Sá»¬a - Validate + xá»­ lÃ½ ngoáº¡i lá»‡ Ä‘Ãºng cÃ¡ch
public void process(String input) {
    if (input == null || input.isBlank())
        throw new IllegalArgumentException("Input khÃ´ng há»£p lá»‡");
    try {
        LocalDate d = LocalDate.parse(input,
            DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        repository.save(new Record(d, input));
    } catch (DateTimeParseException e) {
        log.error("Sai Ä‘á»‹nh dáº¡ng ngÃ y: {}", input, e);
        throw new BadRequestException("Äá»‹nh dáº¡ng ngÃ y khÃ´ng Ä‘Ãºng. YÃªu cáº§u: dd/MM/yyyy");
    }
}`,
      footer: `HÃ£y thay tháº¿ Ä‘oáº¡n code cÅ© báº±ng Ä‘oáº¡n Ä‘Ã£ sá»­a trÃªn. Task Ä‘Ã£ giáº£m tá»« **${task.bugCount || 1} lá»—i** xuá»‘ng 0 sau khi Ã¡p dá»¥ng fix nÃ y.`,
    }, 1800);
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Ká»‹ch báº£n 2: KhÃ´ng thá»ƒ hoÃ n thÃ nh â€” Äá» xuáº¥t hoÃ¡n Ä‘á»•i
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleCannotFinish = () => {
    const task = tasks.find((t) => t.id === selectedTask);
    if (!task) {
      setMessages((p) => [...p, { from: "user", type: "text", text: "TÃ´i khÃ´ng thá»ƒ hoÃ n thÃ nh tÃ¡c vá»¥ nÃ y Ä‘Ãºng háº¡n." }]);
      pushAI({ type: "text", text: "Vui lÃ²ng chá»n cÃ´ng viá»‡c cá»¥ thá»ƒ á»Ÿ Ã´ bÃªn dÆ°á»›i trÆ°á»›c khi gá»­i yÃªu cáº§u nÃ y Ä‘á»ƒ tÃ´i cÃ³ thá»ƒ tÃ¬m ngÆ°á»i phÃ¹ há»£p há»— trá»£ báº¡n." });
      return;
    }

    setMessages((p) => [...p, {
      from: "user", type: "text",
      text: `TÃ´i khÃ´ng thá»ƒ hoÃ n thÃ nh task â€œ${task.name}â€ Ä‘Ãºng háº¡n.`,
    }]);

    /* TÃ¬m thÃ nh viÃªn nháº¹ táº£i nháº¥t (nháº¥t Ã­t task chÆ°a done) */
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const currentAssignee = task.assignee;
      const candidates = team.filter((m) => m.id !== currentAssignee?.id);

      if (candidates.length === 0) {
        setMessages((p) => [...p, {
          from: "ai", type: "text",
          text: "KhÃ´ng tÃ¬m tháº¥y thÃ nh viÃªn khÃ¡c trong nhÃ³m. Vui lÃ²ng thÃªm thÃ nh viÃªn vÃ o nhÃ³m trÆ°á»›c.",
        }]);
        return;
      }

      /* Äáº¿m sá»‘ task chÆ°a done cá»§a má»—i thÃ nh viÃªn */
      const workload = candidates.map((m) => ({
        member: m,
        count: tasks.filter((t) => t.assignee?.id === m.id && t.status !== "done").length,
      }));
      workload.sort((a, b) => a.count - b.count);
      const best = workload[0];

      /* TÃ¬m task nháº¹ nháº¥t cá»§a ngÆ°á»i Ä‘Ã³ Ä‘á»ƒ hoÃ¡n Ä‘á»•i ngÆ°á»£c láº¡i */
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
        text: `TÃ´i Ä‘Ã£ quÃ©t toÃ n bá»™ ${team.length} thÃ nh viÃªn. **${best.member.name}** Ä‘ang cÃ³ khá»‘i lÆ°á»£ng nháº¹ nháº¥t (${best.count} task). Xem Ä‘á» xuáº¥t hoÃ¡n Ä‘á»•i bÃªn dÆ°á»›i.`,
      }]);
    }, 2000);
  };

  /* â”€â”€ Thá»±c hiá»‡n hoÃ¡n Ä‘á»•i â”€â”€ */
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
      text: `âœ… HoÃ¡n Ä‘á»•i thÃ nh cÃ´ng! Task â€œ${fromTask.name}â€ Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn sang **${toMember.name}**. Báº£ng Kanban Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t.`,
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


  /* â”€â”€ Render message â”€â”€ */
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
              <p className="text-xs font-bold text-blue-400">âœ¨ {m.title}</p>
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
                <p className="text-[10px] text-red-400 mb-1 font-semibold uppercase tracking-wider">Code cÅ© (cÃ³ lá»—i)</p>
                <pre className="bg-red-950/40 border border-red-800/50 text-red-300 text-[11px] p-3 rounded-xl overflow-x-auto font-mono leading-relaxed">{m.codeBefore}</pre>
              </div>
              <div>
                <p className="text-[10px] text-green-400 mb-1 font-semibold uppercase tracking-wider">Code Ä‘Ã£ sá»­a</p>
                <pre className="bg-green-950/40 border border-green-800/50 text-green-300 text-[11px] p-3 rounded-xl overflow-x-auto font-mono leading-relaxed">{m.codeAfter}</pre>
              </div>
              <p className="text-xs text-gray-400 italic leading-relaxed">{m.footer}</p>
            </div>
          </div>
        </div>
      );
    }

    /* text thÆ°á»ng */
    return (
      <div key={i} className="flex justify-start">
        <div className="bg-[#111827] border border-gray-800 text-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[80%] leading-relaxed whitespace-pre-line">
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
      <div className="flex-1 flex flex-col bg-[#0b0f1a] border border-gray-800 rounded-2xl overflow-hidden">

        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-800 bg-gradient-to-r from-blue-900/30 to-indigo-900/10">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-white">Trá»£ lÃ½ AI â€” Project Assistant</p>
            <p className="text-[10px] text-gray-500">Sáºµn sÃ ng há»— trá»£ â€¢ PhÃ¢n tÃ­ch code â€¢ Äiá»u phá»‘i cÃ´ng viá»‡c</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map(renderMsg)}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-[#111827] border border-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5">
                {[0, 150, 300].map((d, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-800">
          {/* Quick actions */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <button
              onClick={handleCannotFinish}
              className="text-xs px-3 py-1.5 bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl hover:bg-red-900/50 transition"
            >
              TÃ´i khÃ´ng thá»ƒ hoÃ n thÃ nh task Ä‘Ãºng háº¡n
            </button>
            <button
              onClick={handleAnalyzeBug}
              className="text-xs px-3 py-1.5 bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 rounded-xl hover:bg-yellow-900/50 transition"
            >
              PhÃ¢n tÃ­ch lá»—i code
            </button>
          </div>

          {/* Task selector */}
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="w-full mb-3 p-2.5 bg-black border border-gray-700 rounded-xl text-sm text-gray-300 outline-none focus:border-blue-500"
          >
            <option value="">â€” Chá»n cÃ´ng viá»‡c Ä‘á»ƒ thá»±c hiá»‡n thao tÃ¡c â€”</option>
            <optgroup label="CÃ³ lá»—i / Trá»… háº¡n">
              {bugTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.bugCount > 0 ? ` (ðŸ› ${t.bugCount} lá»—i)` : ""}{isOverdue(t) ? " âš ï¸ Trá»… háº¡n" : ""}
                </option>
              ))}
            </optgroup>
            <optgroup label="Táº¥t cáº£ task Ä‘ang tiáº¿n hÃ nh">
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
              placeholder="Nháº­p tin nháº¯n cho Trá»£ lÃ½ AI..."
              className="flex-1 p-3 bg-black border border-gray-700 focus:border-blue-500 rounded-xl text-sm text-white outline-none placeholder-gray-600"
            />
            <button
              onClick={send}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition"
            >
              Gá»­i
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: TÃ³m táº¯t + Äá» xuáº¥t */}
      <div className="w-72 flex flex-col gap-4">

        {/* Overdue tasks list */}
        <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">âš ï¸ Nguy cÆ¡ trá»… háº¡n</p>
          {tasks.filter(isOverdue).length === 0 ? (
            <p className="text-xs text-gray-600 italic">KhÃ´ng cÃ³ task nÃ o trá»… háº¡n.
              <span className="text-green-400"> Tuyá»‡t vá»i!</span>
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.filter(isOverdue).map((t) => (
                <div key={t.id} className="p-2 bg-red-900/10 border border-red-800/30 rounded-xl">
                  <p className="text-xs font-medium text-red-300">{t.name}</p>
                  {t.assignee && <p className="text-[10px] text-gray-500 mt-0.5">{t.assignee.name}</p>}
                  <p className="text-[10px] text-red-500 mt-0.5">Háº¡n: {t.deadline}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bug tasks */}
        <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3">ðŸ› Lá»—i kiá»ƒm thá»­</p>
          {tasks.filter((t) => t.bugCount > 0).length === 0 ? (
            <p className="text-xs text-gray-600 italic">KhÃ´ng cÃ³ lá»—i nÃ o.</p>
          ) : (
            <div className="space-y-2">
              {tasks.filter((t) => t.bugCount > 0).map((t) => (
                <div key={t.id} className="p-2 bg-yellow-900/10 border border-yellow-800/30 rounded-xl">
                  <p className="text-xs font-medium text-yellow-300">{t.name}</p>
                  <p className="text-[10px] text-red-400 mt-0.5">{t.bugCount} lá»—i tá»“n Ä‘á»Šng</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Táº£i trá»ng thÃ nh viÃªn */}
        <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">ðŸ‘¥ Táº£i trá»ng nhÃ³m</p>
          {team.length === 0 ? (
            <p className="text-xs text-gray-600 italic">ChÆ°a cÃ³ thÃ nh viÃªn.</p>
          ) : (
            <div className="space-y-2">
              {team.map((m) => {
                const cnt = tasks.filter((t) => t.assignee?.id === m.id && t.status !== "done").length;
                const pct = Math.min(100, cnt * 20);
                return (
                  <div key={m.id}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-300">{m.name}</span>
                      <span className="text-gray-500">{cnt} task</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          pct >= 80 ? "bg-red-500" : pct >= 40 ? "bg-yellow-500" : "bg-green-500"
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

      {/* Há»˜P THOáº I Äá»€ XUáº¤T HOÃN Äá»”I */}
      {reassignProposal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0b0f1a] border border-blue-700/50 rounded-2xl w-[480px] shadow-2xl shadow-blue-900/20 animate-fadeIn">

            <div className="px-6 pt-5 pb-4 border-b border-gray-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-400 text-lg">âœ¨</span>
                <h2 className="font-bold text-white">AI Ä‘á» xuáº¥t: HoÃ¡n Ä‘á»•i cÃ´ng viá»‡c</h2>
              </div>
              <p className="text-xs text-gray-400">Há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng cáº­p nháº­t Báº£ng Kanban sau khi xÃ¡c nháº­n</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Task bá»‹ chuyá»ƒn */}
              <div className="p-4 bg-red-900/10 border border-red-800/30 rounded-xl">
                <p className="text-[10px] text-red-400 uppercase font-semibold mb-1">Chuyá»ƒn task nÃ y sang</p>
                <p className="text-sm font-bold text-white">{reassignProposal.fromTask.name}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <span className="text-gray-500">
                    {reassignProposal.fromMember?.name || "(chÆ°a giao)"}
                  </span>
                  <span className="text-blue-400 font-bold">â†’</span>
                  <span className="text-green-400 font-bold">{reassignProposal.toMember.name}</span>
                </div>
              </div>

              {/* Swap ngÆ°á»£c láº¡i */}
              {reassignProposal.swapTask && (
                <div className="p-4 bg-blue-900/10 border border-blue-800/30 rounded-xl">
                  <p className="text-[10px] text-blue-400 uppercase font-semibold mb-1">{reassignProposal.toMember.name} nháº­n láº¡i</p>
                  <p className="text-sm font-bold text-white">{reassignProposal.swapTask.name}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-gray-500">{reassignProposal.toMember.name}</span>
                    <span className="text-blue-400 font-bold">â†’</span>
                    <span className="text-yellow-400 font-bold">{reassignProposal.fromMember?.name || "(khÃ´ng rÃµ)"}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 leading-relaxed">
                LÃ½ do: <span className="text-gray-300">{reassignProposal.toMember.name}</span> Ä‘ang cÃ³ khá»‘i lÆ°á»£ng cÃ´ng viá»‡c tháº¥p nháº¥t trong nhÃ³m â€” AI Ä‘Ã¡nh giÃ¡ cÃ³ thá»ƒ tiáº¿p nháº­n task nÃ y nhanh hÆ¡n.
              </p>
            </div>

            <div className="flex gap-3 px-6 pb-5 justify-end">
              <button
                onClick={() => setReassignProposal(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
              >
                Tá»« chá»‘i
              </button>
              <button
                onClick={confirmReassign}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold text-white transition"
              >
                âœ… Äá»’NG Ã â€” HoÃ¡n Ä‘á»•i ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   REPORT TAB
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ReportTab({ tasks, team, projectName }) {

  /* â”€â”€ Risk Score algorithm â”€â”€ */
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
    riskScore < 30 ? { bar: "#22c55e", text: "text-green-400", label: "An toÃ n",          bg: "bg-green-500" } :
    riskScore < 60 ? { bar: "#eab308", text: "text-yellow-400", label: "Rá»§i ro trung bÃ¬nh", bg: "bg-yellow-500" } :
                     { bar: "#ef4444", text: "text-red-400",    label: "Nguy hiá»ƒm!",        bg: "bg-red-500" };

  /* â”€â”€ Biá»ƒu Ä‘á»“ 1: Tráº¡ng thÃ¡i task â”€â”€ */
  const taskStatusData = useMemo(() => [
    { name: "Chá» xá»­ lÃ½",      value: tasks.filter((t) => t.status === "todo").length,   color: "#64748b" },
    { name: "Äang thá»±c hiá»‡n", value: tasks.filter((t) => t.status === "doing").length,  color: "#3b82f6" },
    { name: "Äang xem xÃ©t",   value: tasks.filter((t) => t.status === "review").length, color: "#f59e0b" },
    { name: "HoÃ n thÃ nh",     value: tasks.filter((t) => t.status === "done").length,   color: "#22c55e" },
  ].filter((d) => d.value > 0), [tasks]);

  /* â”€â”€ Biá»ƒu Ä‘á»“ 2: Hiá»‡u suáº¥t thÃ nh viÃªn â”€â”€ */
  const memberPerfData = useMemo(() => team.map((m) => {
    const myTasks   = tasks.filter((t) => t.assignee?.id === m.id);
    const done      = myTasks.filter((t) => t.status === "done").length;
    const totalBugs = myTasks.reduce((s, t) => s + (t.bugCount || 0), 0);
    const commits   = Math.max(1, done * 3 + myTasks.length * 2);
    const failRate  = myTasks.length > 0 ? Math.round((totalBugs / Math.max(myTasks.length * 2, 1)) * 100) : 0;
    return {
      name:     m.name.length > 9 ? m.name.slice(0, 9) + "â€¦" : m.name,
      fullName: m.name,
      commits,
      pass: 100 - Math.min(failRate, 100),
      fail: Math.min(failRate, 100),
      done,
      total: myTasks.length,
    };
  }), [tasks, team]);

  /* â”€â”€ AI Recommendations â”€â”€ */
  const aiRecommendations = useMemo(() => {
    const recs = [];
    const overdueList     = tasks.filter(isOverdue);
    const highBugMember   = [...memberPerfData].sort((a, b) => b.fail - a.fail)[0];
    const doneRatio       = tasks.length > 0 ? tasks.filter((t) => t.status === "done").length / tasks.length : 0;

    if (riskScore >= 60) {
      recs.push({ type: "danger",  icon: "ðŸš¨", title: "Nguy hiá»ƒm: Dá»± Ã¡n cÃ³ nguy cÆ¡ cháº­m deadline",
        body: `Chá»‰ sá»‘ rá»§i ro Ä‘ang á»Ÿ má»©c ${riskScore}% â€” vÆ°á»£t ngÆ°á»¡ng an toÃ n. Tá»‘c Ä‘á»™ hoÃ n thÃ nh cÃ´ng viá»‡c cá»§a nhÃ³m Ä‘ang giáº£m so vá»›i káº¿ hoáº¡ch ban Ä‘áº§u. Æ¯á»›c tÃ­nh rá»§i ro cháº­m tiáº¿n Ä‘á»™ khoáº£ng 3â€“5 ngÃ y.` });
    } else if (riskScore >= 30) {
      recs.push({ type: "warning", icon: "âš ï¸", title: "Cáº£nh bÃ¡o: Tá»‘c Ä‘á»™ cáº§n cáº£i thiá»‡n",
        body: `Chá»‰ sá»‘ rá»§i ro ${riskScore}% â€” má»©c trung bÃ¬nh. NhÃ³m nÃªn tÄƒng táº§n suáº¥t stand-up hÃ ng ngÃ y vÃ  rÃ  soÃ¡t task Ä‘á»ƒ phÃ¡t hiá»‡n Ä‘iá»ƒm ngháº½n sá»›m.` });
    } else {
      recs.push({ type: "success", icon: "âœ…", title: "Dá»± Ã¡n Ä‘ang á»Ÿ tráº¡ng thÃ¡i tá»‘t",
        body: `Chá»‰ sá»‘ rá»§i ro chá»‰ ${riskScore}% â€” náº±m trong vÃ¹ng an toÃ n. Tiáº¿p tá»¥c duy trÃ¬ nhá»‹p Ä‘á»™ hiá»‡n táº¡i.` });
    }

    if (overdueList.length > 0) {
      recs.push({ type: "warning", icon: "â°", title: `PhÃ¡t hiá»‡n ${overdueList.length} task trá»… háº¡n`,
        body: `CÃ¡c task: ${overdueList.map((t) => `"${t.name}"`).join(", ")} Ä‘ang quÃ¡ háº¡n. Khuyáº¿n nghá»‹ TrÆ°á»Ÿng nhÃ³m há»p kháº©n hoáº·c sá»­ dá»¥ng chá»©c nÄƒng hoÃ¡n Ä‘á»•i task tá»± Ä‘á»™ng táº¡i tab AI Hub.` });
    }

    if (highBugMember && highBugMember.fail >= 50) {
      recs.push({ type: "danger",  icon: "ðŸ›", title: `Tá»· lá»‡ fail test case cao: ${highBugMember.fullName}`,
        body: `ThÃ nh viÃªn ${highBugMember.fullName} Ä‘ang cÃ³ tá»· lá»‡ fail test case lÃªn tá»›i ${highBugMember.fail}%. Khuyáº¿n nghá»‹: TrÆ°á»Ÿng nhÃ³m cáº§n há»p kháº©n Ä‘á»ƒ phÃ¢n chia láº¡i module, giáº£m táº£i Ä‘á»ƒ thÃ nh viÃªn nÃ y cÃ³ thá»i gian xá»­ lÃ½ lá»—i tá»“n Ä‘á»ng.` });
    }

    if (doneRatio >= 0.8) {
      recs.push({ type: "success", icon: "ðŸ†", title: "Tiáº¿n Ä‘á»™ xuáº¥t sáº¯c",
        body: `${Math.round(doneRatio * 100)}% cÃ´ng viá»‡c Ä‘Ã£ hoÃ n thÃ nh. NhÃ³m Ä‘ang lÃ m viá»‡c ráº¥t hiá»‡u quáº£!` });
    }

    if (recs.length <= 1) {
      recs.push({ type: "info", icon: "ðŸ’¡", title: "Gá»£i Ã½: TÄƒng cÆ°á»ng kiá»ƒm thá»­ tá»± Ä‘á»™ng",
        body: "HÃ£y Ä‘áº£m báº£o unit test coverage Ä‘áº¡t Ã­t nháº¥t 80% trÆ°á»›c khi demo sáº£n pháº©m cho Giáº£ng viÃªn hÆ°á»›ng dáº«n." });
    }

    return recs;
  }, [riskScore, tasks, memberPerfData]);

  const recStyle = {
    danger:  { border: "border-red-800/50",    bg: "bg-red-900/10",    icon: "text-red-400",    title: "text-red-300" },
    warning: { border: "border-yellow-800/50", bg: "bg-yellow-900/10", icon: "text-yellow-400", title: "text-yellow-300" },
    success: { border: "border-green-800/50",  bg: "bg-green-900/10",  icon: "text-green-400",  title: "text-green-300" },
    info:    { border: "border-blue-800/50",   bg: "bg-blue-900/10",   icon: "text-blue-400",   title: "text-blue-300" },
  };

  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#111827] border border-gray-700 px-3 py-2 rounded-xl text-xs shadow-lg">
        <p className="font-bold text-white">{payload[0].name}</p>
        <p className="text-gray-300">{payload[0].value} task ({tasks.length > 0 ? ((payload[0].value / tasks.length) * 100).toFixed(0) : 0}%)</p>
      </div>
    );
  };

  const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#111827] border border-gray-700 px-3 py-2 rounded-xl text-xs shadow-lg">
        <p className="font-bold text-white mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}{p.name === "Commits" ? " láº§n" : "%"}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">

      {/* â”€â”€â”€ RISK METER â”€â”€â”€ */}
      <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white">Chá»‰ sá»‘ Rá»§i ro Dá»± Ã¡n</h2>
            <p className="text-xs text-gray-500 mt-0.5">Tá»± Ä‘á»™ng tÃ­nh toÃ¡n tá»« dá»¯ liá»‡u task, lá»—i vÃ  tiáº¿n Ä‘á»™</p>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-black tabular-nums ${riskColor.text}`}>{riskScore}%</p>
            <p className={`text-xs font-semibold mt-1 ${riskColor.text}`}>{riskColor.label}</p>
          </div>
        </div>

        {/* Thanh Ä‘o */}
        <div className="relative mb-2">
          <div className="h-6 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
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
            <div className="w-px h-4 bg-green-500/50" />
          </div>
          <div className="absolute top-0 h-6 flex items-center" style={{ left: "60%" }}>
            <div className="w-px h-4 bg-yellow-500/50" />
          </div>
        </div>
        <div className="flex text-[10px] text-gray-600 mb-5">
          <span className="flex-none">0%</span>
          <span className="text-green-600/70 ml-[26%]">An toÃ n</span>
          <span className="text-yellow-600/70 ml-[22%]">Trung bÃ¬nh</span>
          <span className="text-red-600/70 ml-auto">100%</span>
        </div>

        {/* Pills */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Task trá»… háº¡n",  val: tasks.filter(isOverdue).length,                                   color: "text-red-400 bg-red-900/20 border-red-800/40" },
            { label: "Lá»—i tá»“n Ä‘á»ng",  val: tasks.reduce((s, t) => s + (t.bugCount || 0), 0),                 color: "text-yellow-400 bg-yellow-900/20 border-yellow-800/40" },
            { label: "HoÃ n thÃ nh",    val: `${tasks.filter((t) => t.status === "done").length}/${tasks.length}`, color: "text-green-400 bg-green-900/20 border-green-800/40" },
            { label: "ChÆ°a phÃ¢n cÃ´ng", val: tasks.filter((t) => !t.assignee && t.status !== "done").length,  color: "text-blue-400 bg-blue-900/20 border-blue-800/40" },
          ].map((p) => (
            <div key={p.label} className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs ${p.color}`}>
              <span className="font-bold text-sm">{p.val}</span>
              <span className="opacity-70">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€â”€ BIá»‚U Äá»’ â”€â”€â”€ */}
      <div className="grid grid-cols-2 gap-5">

        {/* Biá»ƒu Ä‘á»“ 1: Tráº¡ng thÃ¡i task */}
        <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-0.5">Tá»· lá»‡ tráº¡ng thÃ¡i Task</h3>
          <p className="text-xs text-gray-500 mb-3">PhÃ¢n bá»‘ cÃ´ng viá»‡c theo tráº¡ng thÃ¡i hiá»‡n táº¡i</p>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-600 text-sm">ChÆ°a cÃ³ task nÃ o</div>
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
                  formatter={(v) => <span className="text-xs text-gray-300">{v}</span>}
                  iconType="circle" iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Biá»ƒu Ä‘á»“ 2: Hiá»‡u suáº¥t thÃ nh viÃªn */}
        <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-0.5">Hiá»‡u suáº¥t thÃ nh viÃªn</h3>
          <p className="text-xs text-gray-500 mb-3">Táº§n suáº¥t commit vÃ  tá»· lá»‡ Pass/Fail test case</p>
          {team.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-600 text-sm">ChÆ°a cÃ³ thÃ nh viÃªn</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={memberPerfData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip content={<BarTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-gray-300">{v}</span>} iconSize={8} />
                <Bar dataKey="commits" name="Commits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pass"    name="Pass %"  fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fail"    name="Fail %"  fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* â”€â”€â”€ AI RECOMMENDATIONS â”€â”€â”€ */}
      <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <h3 className="text-sm font-bold text-white">PhÃ¢n tÃ­ch & Khuyáº¿n nghá»‹ tá»« AI</h3>
          <span className="text-[10px] text-gray-500 ml-auto">
            Cáº­p nháº­t: {new Date().toLocaleTimeString("vi-VN")}
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
                    <p className="text-xs text-gray-400 leading-relaxed">{rec.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Báº£ng chi tiáº¿t thÃ nh viÃªn */}
        {team.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Chi tiáº¿t hiá»‡u suáº¥t tá»«ng thÃ nh viÃªn
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-xs">
                <thead className="bg-gray-900/60">
                  <tr>
                    {["ThÃ nh viÃªn", "Task nháº­n", "HoÃ n thÃ nh", "Commits", "Pass %", "Fail %", "ÄÃ¡nh giÃ¡"].map((h) => (
                      <th key={h} className="text-left text-gray-500 py-2.5 px-4 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {memberPerfData.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-900/30 transition">
                      <td className="py-3 px-4 text-gray-200 font-medium">{m.fullName}</td>
                      <td className="py-3 px-4 text-gray-400">{m.total}</td>
                      <td className="py-3 px-4 text-green-400">{m.done}</td>
                      <td className="py-3 px-4 text-blue-400">{m.commits}</td>
                      <td className="py-3 px-4 text-green-400">{m.pass}%</td>
                      <td className="py-3 px-4">
                        <span className={m.fail >= 50 ? "text-red-400 font-bold" : "text-gray-400"}>
                          {m.fail}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                          m.fail >= 50 ? "bg-red-900/30 text-red-400 border border-red-800/50" :
                          m.fail >= 25 ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800/50" :
                                         "bg-green-900/30 text-green-400 border border-green-800/50"
                        }`}>
                          {m.fail >= 50 ? "Cáº§n há»— trá»£" : m.fail >= 25 ? "Cáº§n theo dÃµi" : "Tá»‘t"}
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CI/CD TAB
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function CICDTab({ tasks, team }) {

  /* Táº¡o lá»‹ch sá»­ commit giáº£ láº­p cÃ³ gáº¯n vá»›i task tháº­t */
  const commitHistory = useMemo(() => {
    const statuses = ["success", "success", "success", "failed", "running"];
    const msgs = [
      "feat: thÃªm chá»©c nÄƒng xÃ¡c thá»±c ngÆ°á»i dÃ¹ng",
      "fix: sá»­a lá»—i validate form Ä‘Äƒng nháº­p",
      "refactor: tÃ¡ch logic service layer",
      "feat: tÃ­ch há»£p JWT authentication",
      "fix: xá»­ lÃ½ exception NullPointerException",
      "test: thÃªm unit test cho UserService",
      "feat: hoÃ n thiá»‡n API quáº£n lÃ½ dá»± Ã¡n",
      "fix: sá»­a lá»—i ngÃ y thÃ¡ng khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng",
      "chore: cáº­p nháº­t dependencies",
      "feat: thÃªm drag-drop cho Kanban board",
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

    // ThÃªm vÃ i commit khÃ´ng gáº¯n task náº¿u khÃ´ng cÃ³ team
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
    success: { dot: "bg-green-500", text: "text-green-400", border: "border-green-800/40", bg: "bg-green-900/10", label: "ThÃ nh cÃ´ng", icon: "âœ“" },
    failed:  { dot: "bg-red-500",   text: "text-red-400",   border: "border-red-800/40",   bg: "bg-red-900/10",   label: "Tháº¥t báº¡i",   icon: "âœ—" },
    running: { dot: "bg-yellow-500 animate-pulse", text: "text-yellow-400", border: "border-yellow-800/40", bg: "bg-yellow-900/10", label: "Äang cháº¡y", icon: "â†º" },
  };

  const totalPassed = commitHistory.reduce((s, c) => s + c.passTests, 0);
  const totalFailed = commitHistory.reduce((s, c) => s + c.failTests, 0);
  const successBuilds = commitHistory.filter((c) => c.status === "success").length;
  const failedBuilds  = commitHistory.filter((c) => c.status === "failed").length;

  return (
    <div className="space-y-5">

      {/* â”€â”€â”€ SUMMARY CARDS â”€â”€â”€ */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tá»•ng builds",    val: commitHistory.length, color: "text-blue-400",   border: "border-blue-800/40",   bg: "bg-blue-900/10" },
          { label: "Build thÃ nh cÃ´ng", val: successBuilds,       color: "text-green-400",  border: "border-green-800/40",  bg: "bg-green-900/10" },
          { label: "Build tháº¥t báº¡i",   val: failedBuilds,        color: "text-red-400",    border: "border-red-800/40",    bg: "bg-red-900/10" },
          { label: "Test case pass",   val: `${totalPassed}/${totalPassed + totalFailed}`, color: "text-purple-400", border: "border-purple-800/40", bg: "bg-purple-900/10" },
        ].map((c) => (
          <div key={c.label} className={`p-4 border ${c.border} ${c.bg} rounded-2xl`}>
            <p className={`text-2xl font-black tabular-nums ${c.color}`}>{c.val}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* â”€â”€â”€ PIPELINE TIMELINE â”€â”€â”€ */}
        <div className="col-span-2 bg-[#0b0f1a] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-white">Lá»‹ch sá»­ Äáº©y Code & CI/CD</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Pipeline tá»± Ä‘á»™ng cháº¡y test sau má»—i commit</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400">Pipeline online</span>
            </div>
          </div>

          <div className="divide-y divide-gray-900 max-h-[520px] overflow-y-auto">
            {commitHistory.map((c, idx) => {
              const s = statusConfig[c.status];
              return (
                <div key={c.id} className={`px-5 py-3.5 hover:bg-gray-900/30 transition ${idx === 0 ? "bg-gray-900/20" : ""}`}>
                  <div className="flex items-start gap-3">

                    {/* Timeline dot */}
                    <div className="flex flex-col items-center flex-shrink-0 mt-1">
                      <div className={`w-3 h-3 rounded-full ${s.dot} ring-2 ring-gray-900`} />
                      {idx < commitHistory.length - 1 && <div className="w-px flex-1 bg-gray-800 mt-1" style={{ minHeight: "24px" }} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Row 1: commit message + SHA */}
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-200 truncate">{c.message}</p>
                        <span className="font-mono text-[10px] text-gray-600 flex-shrink-0 bg-gray-900 px-1.5 py-0.5 rounded">#{c.sha}</span>
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
                        <span className="text-gray-700">â€¢</span>
                        <span className="text-indigo-400/80">âŽ‡ {c.branch}</span>
                        <span className="text-gray-700">â€¢</span>
                        <span>{c.time}</span>
                        {c.relatedTask && (
                          <>
                            <span className="text-gray-700">â€¢</span>
                            <span className="text-blue-400/70 truncate max-w-[120px]" title={c.relatedTask.name}>
                              ðŸ”— {c.relatedTask.name.slice(0, 18)}{c.relatedTask.name.length > 18 ? "â€¦" : ""}
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

        {/* â”€â”€â”€ RIGHT PANEL â”€â”€â”€ */}
        <div className="flex flex-col gap-4">

          {/* Tá»· lá»‡ build theo thÃ nh viÃªn */}
          <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-white mb-3">Tá»· lá»‡ thÃ nh cÃ´ng theo thÃ nh viÃªn</h4>
            {team.length === 0 ? (
              <p className="text-xs text-gray-600 italic">ChÆ°a cÃ³ thÃ nh viÃªn</p>
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
          <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-red-400 mb-3">ðŸ”´ Builds tháº¥t báº¡i gáº§n Ä‘Ã¢y</h4>
            {commitHistory.filter((c) => c.status === "failed").length === 0 ? (
              <p className="text-xs text-gray-600 italic">KhÃ´ng cÃ³ build tháº¥t báº¡i. <span className="text-green-400">Xuáº¥t sáº¯c!</span></p>
            ) : (
              <div className="space-y-2">
                {commitHistory.filter((c) => c.status === "failed").slice(0, 4).map((c) => (
                  <div key={c.id} className="p-2.5 bg-red-900/10 border border-red-800/30 rounded-xl">
                    <p className="text-xs text-red-300 font-medium truncate">{c.message.slice(0, 35)}â€¦</p>
                    <p className="text-[10px] text-gray-500 mt-1">{c.author} â€¢ {c.failTests} test fail</p>
                    <span className="font-mono text-[9px] text-gray-600">#{c.sha}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pipeline stages legend */}
          <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-white mb-3">CÃ¡c giai Ä‘oáº¡n Pipeline</h4>
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
      <div className="text-4xl opacity-30">ðŸš§</div>
      <p className="text-lg font-medium text-gray-500">Tab "{label}"</p>
      <p className="text-sm">Chá»©c nÄƒng Ä‘ang Ä‘Æ°á»£c phÃ¡t triá»ƒn...</p>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MEMBERS TAB
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function MembersTab({ tasks, team, setTeam, projectId, isOwner }) {
  const [emailQuery, setEmailQuery] = useState("");
  const [results,    setResults]    = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [searchDone, setSearchDone] = useState(false); // Ä‘Ã£ search xong chÆ°a
  const [apiError,   setApiError]   = useState(false); // backend chÆ°a cháº¡y?
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
        // Loáº¡i bá» nhá»¯ng ngÆ°á»i Ä‘Ã£ lÃ  thÃ nh viÃªn
        const filtered = data.filter(
          (u) => !team.some((m) => String(m.id) === String(u.id))
        );
        setResults(filtered);
        setShowDrop(true); // luÃ´n show â€” ká»ƒ cáº£ khi rá»—ng (hiá»ƒn "khÃ´ng tÃ¬m tháº¥y")
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


  /* Click ngoÃ i Ä‘Ã³ng dropdown */
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Má»i thÃ nh viÃªn */
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
      showToast(`ÄÃ£ má»i ${user.fullName || user.username} vÃ o dá»± Ã¡n!`);
    } catch (err) {
      showToast(err.response?.data?.message || "Má»i tháº¥t báº¡i. Vui lÃ²ng thá»­ láº¡i.", "error");
    } finally { setInviting(null); }
  };

  /* XÃ³a thÃ nh viÃªn */
  const handleRemove = async (member) => {
    if (!window.confirm(`XÃ³a ${member.name} khá»i dá»± Ã¡n?`)) return;
    setRemoving(member.id);
    try {
      const { default: apiClient } = await import("../services/api");
      await apiClient.delete(`/projects/${projectId}/members/${member.id}`);
      const updated = team.filter((m) => m.id !== member.id);
      setTeam(updated);
      localStorage.setItem("team", JSON.stringify(updated));
      showToast(`ÄÃ£ xÃ³a ${member.name} khá»i dá»± Ã¡n.`);
    } catch (err) {
      showToast(err.response?.data?.message || "XÃ³a tháº¥t báº¡i.", "error");
    } finally { setRemoving(null); }
  };

  /* Avatar mÃ u */
  const avatarColor = (name) => {
    const colors = ["bg-blue-600","bg-purple-600","bg-green-600","bg-orange-500","bg-pink-600","bg-teal-600"];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  /* TÃ­nh stats tá»«ng thÃ nh viÃªn */
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
          {toast.type === "error" ? "âœ—" : "âœ“"} {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">ThÃ nh ViÃªn Dá»± Ãn</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalMembers} thÃ nh viÃªn Â· {avgProgress}% tiáº¿n Ä‘á»™ trung bÃ¬nh
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tá»•ng thÃ nh viÃªn",  val: totalMembers,  color: "text-blue-400",   border: "border-blue-800/40",   bg: "bg-blue-900/10" },
          { label: "Tasks Ä‘Ã£ hoÃ n thÃ nh", val: `${totalDone}/${totalTasks}`, color: "text-green-400",  border: "border-green-800/40",  bg: "bg-green-900/10" },
          { label: "Tiáº¿n Ä‘á»™ TB",       val: `${avgProgress}%`, color: "text-purple-400", border: "border-purple-800/40", bg: "bg-purple-900/10" },
          { label: "Trá»… háº¡n",          val: memberStats.reduce((s,m)=>s+m.overdue,0), color: "text-red-400", border: "border-red-800/40", bg: "bg-red-900/10" },
        ].map((c) => (
          <div key={c.label} className={`p-4 border ${c.border} ${c.bg} rounded-2xl`}>
            <p className={`text-2xl font-black tabular-nums ${c.color}`}>{c.val}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* INVITE â€” chá»‰ owner tháº¥y */}
      {isOwner && (
        <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-400 text-lg">ï¼‹</span>
            Má»i ThÃ nh ViÃªn Má»›i
          </h3>

          <div className="relative" ref={dropRef}>
            {/* Search input */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                value={emailQuery}
                onChange={(e) => { setEmailQuery(e.target.value); }}
                onFocus={() => emailQuery.trim().length >= 2 && setShowDrop(true)}
                placeholder="Nháº­p email Ä‘á»ƒ tÃ¬m kiáº¿m thÃ nh viÃªn..."
                className="w-full pl-10 pr-10 py-3 bg-black border border-gray-700 focus:border-blue-500 rounded-xl outline-none text-sm text-white placeholder-gray-500 transition"
              />
              {/* Spinner */}
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              )}
              {/* Clear button */}
              {!searching && emailQuery && (
                <button
                  onClick={() => { setEmailQuery(""); setShowDrop(false); setResults([]); setSearchDone(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg leading-none transition"
                >
                  Ã—
                </button>
              )}
            </div>

            {/* DROPDOWN KET QUA */}
            {showDrop && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1120] border border-gray-700/80 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">

                {/* Loi API */}
                {apiError && (
                  <div className="flex items-start gap-3 px-5 py-4">
                    <span className="text-xl mt-0.5">âš ï¸</span>
                    <div>
                      <p className="text-sm font-medium text-yellow-400">KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c tá»›i server</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Vui lÃ²ng khá»Ÿi Ä‘á»™ng Spring Boot rá»“i thá»­ láº¡i.
                      </p>
                    </div>
                  </div>
                )}

                {/* Khong tim thay */}
                {!apiError && searchDone && results.length === 0 && (
                  <div className="flex items-center gap-3 px-5 py-4">
                    <span className="text-xl">ðŸ”</span>
                    <div>
                      <p className="text-sm text-gray-300">
                        KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng vá»›i email{" "}
                        <span className="text-white font-medium">&ldquo;{emailQuery}&rdquo;</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Kiá»ƒm tra láº¡i email hoáº·c ngÆ°á»i dÃ¹ng chÆ°a Ä‘Äƒng kÃ½ tÃ i khoáº£n.
                      </p>
                    </div>
                  </div>
                )}

                {/* Co ket qua */}
                {!apiError && results.length > 0 && results.map((u, idx) => (
                  <div
                    key={u.id}
                    className={`flex items-center gap-4 px-4 py-3.5 hover:bg-blue-600/10 transition ${
                      idx < results.length - 1 ? "border-b border-gray-800/70" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-11 h-11 rounded-full ${avatarColor(u.fullName || u.username)}
                        flex items-center justify-center text-base font-bold text-white flex-shrink-0
                        shadow-lg ring-2 ring-black`}
                    >
                      {(u.fullName || u.username)?.charAt(0)?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {u.fullName || u.username}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>

                    {/* Nut + them thanh vien */}
                    <button
                      onClick={() => handleInvite(u)}
                      disabled={inviting === u.email}
                      title="ThÃªm vÃ o nhÃ³m"
                      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                        font-bold text-lg transition-all shadow-md
                        ${
                          inviting === u.email
                            ? "bg-gray-700 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 hover:scale-110 active:scale-95 text-white"
                        }`}
                    >
                      {inviting === u.email ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="leading-none">ï¼‹</span>
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
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
          <div className="text-5xl opacity-20">ðŸ‘¥</div>
          <p className="text-gray-500 font-medium">ChÆ°a cÃ³ thÃ nh viÃªn nÃ o trong dá»± Ã¡n</p>
          {isOwner && <p className="text-sm">Sá»­ dá»¥ng Ã´ tÃ¬m kiáº¿m phÃ­a trÃªn Ä‘á»ƒ má»i thÃ nh viÃªn</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {memberStats.map((m) => (
            <div
              key={m.id}
              className="bg-[#0b0f1a] border border-gray-800 hover:border-blue-500/50 rounded-2xl p-5 transition-all"
            >
              {/* Avatar + tÃªn + badge */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-full ${avatarColor(m.name)} flex items-center justify-center text-base font-bold text-white flex-shrink-0`}>
                  {m.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white truncate">{m.name}</h3>
                    {m.overdue > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-900/40 border border-red-700/50 text-red-400 rounded-full font-semibold">
                        {m.overdue} trá»… háº¡n
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{m.email || ""}</p>
                </div>

                {/* NÃºt xÃ³a â€” chá»‰ owner */}
                {isOwner && (
                  <button
                    onClick={() => handleRemove(m)}
                    disabled={removing === m.id}
                    className="flex-shrink-0 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                    title="XÃ³a thÃ nh viÃªn"
                  >
                    {removing === m.id ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
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
                  <span className="text-gray-400">Tiáº¿n Ä‘á»™</span>
                  <span className={`font-bold ${
                    m.pct >= 80 ? "text-green-400" : m.pct >= 40 ? "text-blue-400" : "text-yellow-400"
                  }`}>{m.pct}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${m.barColor}`}
                    style={{ width: `${Math.max(m.pct, m.total > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { val: m.total,      label: "Tá»•ng",    color: "text-gray-300" },
                  { val: m.done,       label: "Xong",    color: "text-green-400" },
                  { val: m.inProgress, label: "Äang lÃ m", color: "text-blue-400" },
                  { val: m.bugs,       label: "Lá»—i",     color: m.bugs > 0 ? "text-red-400" : "text-gray-600" },
                ].map((s) => (
                  <div key={s.label} className="bg-black/40 rounded-xl py-2">
                    <p className={`text-base font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-gray-600">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Task list (náº¿u cÃ³) */}
              {m.myTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">CÃ´ng viá»‡c Ä‘ang phá»¥ trÃ¡ch</p>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {m.myTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          t.status === "done"   ? "bg-green-500" :
                          t.status === "doing"  ? "bg-blue-500"  :
                          t.status === "review" ? "bg-yellow-500" : "bg-gray-600"
                        }`} />
                        <span className={`text-xs truncate flex-1 ${
                          isOverdue(t) ? "text-red-400" : "text-gray-400"
                        }`}>{t.name}</span>
                        {t.status === "done" && <span className="text-[10px] text-green-500 flex-shrink-0">âœ“</span>}
                        {isOverdue(t)       && <span className="text-[10px] text-red-400 flex-shrink-0">âš </span>}
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

  /* Modal táº¡o/sá»­a task */
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

  /* â”€â”€ LOAD â”€â”€ */
  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const current = projects.find((p) => p.id === id);
    if (current) setProjectName(current.name);

    const cols = JSON.parse(localStorage.getItem("columns_" + id)) || [];
    const tks  = JSON.parse(localStorage.getItem("tasks_" + id)) || [];

    if (cols.length === 0) {
      const init = [
        { id: "todo",   name: "Chá» xá»­ lÃ½" },
        { id: "doing",  name: "Äang thá»±c hiá»‡n" },
        { id: "review", name: "Äang xem xÃ©t" },
        { id: "done",   name: "HoÃ n thÃ nh" },
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

  /* â”€â”€ TASK CRUD â”€â”€ */
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

    let updated;
    if (editTask?.id) {
      updated = tasks.map((t) =>
        t.id === editTask.id
          ? { ...t, name: formName, assignee: assigneeObj, score: scoreVal, bugCount: bugVal, deadline: formDeadline || null }
          : t
      );
    } else {
      updated = [...tasks, {
        id: Date.now().toString(),
        name: formName,
        status: editTask.status,
        assignee: assigneeObj,
        score: scoreVal,
        bugCount: bugVal,
        deadline: formDeadline || null,
      }];
    }
    saveTasks(updated);
    setModal(false);
  };

  const deleteTask = (task) => saveTasks(tasks.filter((t) => t.id !== task.id));

  const changeAssignee = (task, member) => saveTasks(tasks.map((t) =>
    t.id === task.id ? { ...t, assignee: t.assignee?.id === member.id ? null : member } : t
  ));

  const changeScore = (task, val) => saveTasks(tasks.map((t) => t.id === task.id ? { ...t, score: val } : t));

  const openAI = (task) => {
    setChatQuestion(`TÃ´i cáº§n há»— trá»£ vá»›i task "${task.name}"${task.bugCount > 0 ? ` â€” Ä‘ang cÃ³ ${task.bugCount} lá»—i kiá»ƒm thá»­` : ""}. HÃ£y giÃºp tÃ´i phÃ¢n tÃ­ch váº¥n Ä‘á».`);
    setChatOpen(true);
  };

  /* â”€â”€ COLUMN â”€â”€ */
  const addColumn = () => {
    if (!newColName.trim()) return;
    saveColumns([...columns, { id: Date.now().toString(), name: newColName }]);
    setNewCol(false); setNewColName("");
  };
  const renameColumn = (colId, name) => saveColumns(columns.map((c) => c.id === colId ? { ...c, name } : c));
  const deleteColumn = (colId) => { saveColumns(columns.filter((c) => c.id !== colId)); saveTasks(tasks.filter((t) => t.status !== colId)); };

  /* â”€â”€ DRAG â”€â”€ */
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

  /* â”€â”€ RENDER â”€â”€ */
  return (
    <div className="min-h-screen bg-[#070a12] text-white flex flex-col">

      {/* HEADER */}
      <div className="flex items-center gap-4 px-6 pt-5 pb-0">
        <button onClick={() => navigate("/project")} className="text-blue-500 hover:underline text-sm">
          â† Quay láº¡i Dá»± Ãn
        </button>
        <h1 className="text-xl font-bold text-white">{projectName}</h1>
      </div>

      {/* TABS */}
      <div className="flex gap-0 px-6 mt-4 border-b border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
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
          <CICDTab tasks={tasks} team={team} />
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
                  <div className="bg-[#0b0f1a] border border-gray-700 p-3 rounded-2xl">
                    <input
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addColumn()}
                      className="w-full bg-black border border-gray-600 px-2 py-1.5 mb-3 rounded-lg text-sm outline-none"
                      placeholder="TÃªn cá»™t..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={addColumn} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm">ThÃªm</button>
                      <button onClick={() => setNewCol(false)} className="px-3 py-1.5 text-gray-400 hover:text-white text-sm">Há»§y</button>
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

      {/* â”€â”€ MODAL Táº O / Sá»¬A CÃ”NG VIá»†C â”€â”€ */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0b0f1a] border border-gray-700 rounded-2xl w-[440px] shadow-2xl">
            <div className="flex justify-between items-center px-5 pt-5 pb-4 border-b border-gray-800">
              <h2 className="font-bold text-base">{editTask?.id ? "Chá»‰nh sá»­a cÃ´ng viá»‡c" : "Táº¡o cÃ´ng viá»‡c"}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white">âœ•</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* TÃªn */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">TÃªn cÃ´ng viá»‡c <span className="text-red-400">*</span></label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveTask()}
                  className="w-full p-2.5 bg-black border border-gray-700 focus:border-blue-500 rounded-xl outline-none text-sm text-white"
                  placeholder="Nháº­p tÃªn cÃ´ng viá»‡c..."
                  autoFocus
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Háº¡n hoÃ n thÃ nh</label>
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full p-2.5 bg-black border border-gray-700 focus:border-blue-500 rounded-xl outline-none text-sm text-white cursor-pointer"
                />
              </div>

              {/* Äiá»ƒm 1-10 */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Äiá»ƒm Ä‘á»™ khÃ³ <span className="text-gray-600 text-xs">(1 = dá»…, 10 = khÃ³)</span></label>
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
                          : "border-gray-700 bg-black text-gray-500 hover:border-gray-500"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sá»‘ lá»—i kiá»ƒm thá»­ */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Sá»‘ lá»—i kiá»ƒm thá»­ tá»“n Ä‘á»ng
                  <span className="text-gray-600 text-xs ml-1">(hiá»‡n trÃªn tháº» náº¿u &gt; 0)</span>
                </label>
                <input
                  type="number" min={0}
                  value={formBugCount}
                  onChange={(e) => setFormBugCount(e.target.value)}
                  placeholder="0"
                  className="w-32 p-2.5 bg-black border border-gray-700 focus:border-blue-500 rounded-xl outline-none text-sm text-white"
                />
              </div>

              {/* NgÆ°á»i thá»±c hiá»‡n */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">NgÆ°á»i thá»±c hiá»‡n</label>
                {team.length === 0
                  ? <p className="text-xs text-gray-600 italic">ChÆ°a cÃ³ thÃ nh viÃªn nÃ o.</p>
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
                                : "border-gray-700 bg-black text-gray-400 hover:border-gray-500"}`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                              ${selected ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}>
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
                onClick={() => { openAI({ name: formName || "cÃ´ng viá»‡c nÃ y", bugCount: parseInt(formBugCount) || 0 }); setModal(false); }}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-700/30 hover:bg-indigo-700/50 border border-indigo-600/50 rounded-xl text-xs text-indigo-300 transition"
              >
                âœ¨ Nhá» Trá»£ lÃ½ AI há»— trá»£
              </button>

              <div className="flex gap-2">
                <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Há»§y</button>
                <button onClick={saveTask} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold">
                  {editTask?.id ? "LÆ°u thay Ä‘á»•i" : "Táº¡o cÃ´ng viá»‡c"}
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

      {/* NÃºt má»Ÿ chatbot ná»•i (khi Ä‘Ã³ng) */}
      {!chatOpen && (
        <button
          onClick={() => { setChatQuestion(""); setChatOpen(true); }}
          className="fixed bottom-6 right-6 z-[100] w-13 h-13 p-3.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-2xl hover:scale-110 transition-transform"
          title="Má»Ÿ Trá»£ lÃ½ AI"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
        </button>
      )}
    </div>
  );
}
