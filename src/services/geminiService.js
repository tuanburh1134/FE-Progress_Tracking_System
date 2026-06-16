/**
 * Gemini AI Service — tối ưu token tối đa
 *
 * Chiến lược tiết kiệm token:
 * - Dùng model gemini-2.0-flash (rẻ + nhanh nhất)
 * - Giới hạn lịch sử chat: chỉ giữ 4 tin nhắn gần nhất
 * - maxOutputTokens: 400 (đủ để trả lời ngắn gọn)
 * - System prompt cực ngắn
 * - Không gửi metadata thừa
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/** Số tin nhắn lịch sử tối đa gửi kèm (tiết kiệm token) */
const MAX_HISTORY = 4;

/** System prompt ngắn gọn — càng ngắn càng ít token */
const SYSTEM_PROMPT = `Bạn là trợ lý AI của hệ thống quản lý dự án phần mềm. 
Trả lời ngắn gọn, thực tế, tập trung vào quản lý task, tiến độ, phân công công việc.
Không lan man. Tối đa 3-4 câu mỗi câu trả lời.`;

/**
 * Gọi Gemini với lịch sử chat.
 *
 * @param {string} userMessage - Tin nhắn người dùng vừa gửi
 * @param {Array<{role: string, text: string}>} history - Lịch sử hội thoại
 * @param {Object} context - Dữ liệu dự án (tasks, team) để AI hiểu ngữ cảnh
 * @returns {Promise<string>} Câu trả lời từ Gemini
 */
export async function askGemini(userMessage, history = [], context = {}) {
  if (!GEMINI_API_KEY) {
    return "⚠️ Chưa cấu hình Gemini API key. Vui lòng kiểm tra file .env.local";
  }

  // Xây dựng context ngắn gọn từ dữ liệu dự án
  let contextStr = "";
  if (context.tasks?.length > 0 || context.team?.length > 0) {
    const doneTasks  = context.tasks?.filter(t => t.status === "done").length ?? 0;
    const totalTasks = context.tasks?.length ?? 0;
    const overdue    = context.tasks?.filter(t => {
      if (!t.deadline || t.status === "done") return false;
      return t.deadline <= new Date().toISOString().split("T")[0];
    }).length ?? 0;

    contextStr = `\n[Dự án: ${totalTasks} task, ${doneTasks} xong, ${overdue} trễ hạn, ${context.team?.length ?? 0} thành viên]`;
  }

  // Chỉ lấy MAX_HISTORY tin nhắn gần nhất (tiết kiệm token)
  const recentHistory = history.slice(-MAX_HISTORY);

  // Chuyển lịch sử sang format Gemini
  const contents = recentHistory.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  // Thêm tin nhắn hiện tại
  contents.push({
    role: "user",
    parts: [{ text: userMessage + contextStr }],
  });

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: 400,   // Giới hạn output token
          temperature: 0.7,
          topP: 0.9,
          // Không cần candidateCount > 1
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || res.statusText;
      // Hết quota free tier
      if (res.status === 429) {
        const retryAfter = err?.error?.details?.find(d => d?.retryDelay)?.retryDelay || "";
        return `⏳ Gemini API đã vượt giới hạn quota miễn phí (429).\n\nCách khắc phục:\n1. Lấy API key mới tại https://aistudio.google.com/apikey\n2. Cập nhật VITE_GEMINI_API_KEY trong file .env.local\n3. Restart dev server${retryAfter ? `\n\nHoặc thử lại sau: ${retryAfter}` : ""}`;
      }
      // API key lỗi format → gợi ý
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return `❌ API key không hợp lệ (${res.status}). Vui lòng lấy key mới tại https://aistudio.google.com/apikey`;
      }
      return `❌ Lỗi Gemini API (${res.status}): ${msg}`;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) return "❌ Gemini không trả về nội dung. Thử lại nhé.";
    return text.trim();

  } catch (err) {
    if (err.name === "TypeError") {
      return "❌ Không thể kết nối tới Gemini API. Kiểm tra internet hoặc CORS.";
    }
    return `❌ Lỗi: ${err.message}`;
  }
}
