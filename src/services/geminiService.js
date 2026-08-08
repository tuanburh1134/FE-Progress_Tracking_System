/**
 * Gemini AI Service — tối ưu token tối đa
 *
 * Chiến lược tiết kiệm token:
 * - Dùng model gemini-2.5-flash (rẻ + nhanh nhất)
 * - Giới hạn lịch sử chat: chỉ giữ 4 tin nhắn gần nhất
 * - maxOutputTokens: 400 (đủ để trả lời ngắn gọn)
 * - System prompt cực ngắn
 * - Không gửi metadata thừa
 */

// Hỗ trợ cả danh sách VITE_GEMINI_API_KEYS hoặc key đơn lẻ VITE_GEMINI_API_KEY
const apiKeysStr = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_API_KEYS = apiKeysStr
  .split(",")
  .map(k => k.trim())
  .filter(Boolean);

let currentKeyIndex = 0;

/** Số tin nhắn lịch sử tối đa gửi kèm (tiết kiệm token) */
const MAX_HISTORY = 4;

/** System prompt bảo mật và định hướng bối cảnh dự án */
const SYSTEM_PROMPT = `Bạn là trợ lý AI chuyên nghiệp thuộc dự án hiện tại của người dùng.
NHIỆM VỤ CỦA BẠN:
1. Chỉ hỗ trợ, trả lời và đưa ra lời khuyên về dự án hiện tại dựa trên bối cảnh dự án được cung cấp (tên dự án, thành viên, tasks, git commits).
2. Tuyệt đối không trả lời về các dự án khác hoặc thông tin ngoài dự án này. Nếu được hỏi ngoài bối cảnh dự án hiện tại, hãy từ chối một cách lịch sự nhưng kiên quyết (ví dụ: "Tôi là trợ lý chuyên trách của dự án này và không thể hỗ trợ các thông tin ngoài phạm vi dự án hiện tại.").
3. Phân tích lỗi (failed test từ git), gợi ý sửa code, phân chia công việc hoặc tư vấn tiến độ dựa trên dữ liệu thật của dự án. Trả lời rõ ràng, dễ hiểu, chuyên nghiệp và có chiều sâu.
4. Khi người dùng đính kèm mã nguồn từ Git vào bối cảnh dự án, bạn có nhiệm vụ đọc kỹ, giải thích logic dòng code, tìm lỗi sai hoặc hướng dẫn cải tiến cụ thể khi được yêu cầu.
5. Khi người dùng hỏi về tiến độ công việc của một thành viên cụ thể trong dự án, hãy chủ động phân tích danh sách các tasks được phân công cho họ (Giao cho: tên người đó) dựa trên dữ liệu công việc được cung cấp. Hãy giải thích chi tiết xem họ đang thực hiện những công việc nào (doing), đã xong việc nào (done), có task nào đang trễ hạn (overdue) hoặc bị lỗi (bugCount) hay không, từ đó đưa ra đánh giá cụ thể về tiến độ của người đó.`;

/**
 * Gọi Gemini với lịch sử chat và tự động xoay vòng API Keys nếu gặp lỗi.
 *
 * @param {string} userMessage - Tin nhắn người dùng vừa gửi
 * @param {Array<{role: string, text: string}>} history - Lịch sử hội thoại
 * @param {Object} context - Dữ liệu dự án (tasks, team, projectDetailedContext) để AI hiểu ngữ cảnh
 * @returns {Promise<string>} Câu trả lời từ Gemini
 */
export async function askGemini(userMessage, history = [], context = {}) {
  if (GEMINI_API_KEYS.length === 0) {
    return "⚠️ Chưa cấu hình Gemini API key. Vui lòng kiểm tra file .env.local";
  }

  // Xây dựng bối cảnh dự án từ dữ liệu nhận được
  let contextStr = "";
  if (context.projectDetailedContext) {
    contextStr = `\n\n[Bối cảnh chi tiết của dự án hiện tại]:\n${context.projectDetailedContext}`;
  } else if (context.tasks?.length > 0 || context.team?.length > 0) {
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

  // Duyệt qua danh sách keys từ vị trí currentKeyIndex
  for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
    const activeIndex = (currentKeyIndex + attempt) % GEMINI_API_KEYS.length;
    const apiKey = GEMINI_API_KEYS[activeIndex];
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

    try {
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1500,   // Giới hạn output token dài hơn để giải thích code
            temperature: 0.7,
            topP: 0.9,
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
        // Nếu lỗi do hết quota, API key lỗi/hết hạn, hoặc server overloaded → thử key tiếp theo
        if (res.status === 429 || res.status === 400 || res.status === 401 || res.status === 403 || res.status === 503 || res.status === 502) {
          console.warn(`Gemini API Key thứ ${activeIndex + 1} gặp lỗi HTTP ${res.status}. Đang chuyển sang key tiếp theo...`);
          continue;
        }
        
        // Với các lỗi HTTP khác, hiển thị trực tiếp
        const err = await res.json().catch(() => ({}));
        return `❌ Lỗi Gemini API (${res.status}): ${err?.error?.message || res.statusText}`;
      }

      // Lưu lại key index hoạt động tốt nhất cho lần sau
      currentKeyIndex = activeIndex;

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) return "❌ Gemini không trả về nội dung. Thử lại nhé.";
      return text.trim();

    } catch (err) {
      if (err.name === "TypeError") {
        // Lỗi kết nối mạng chung, thử lại với key sau hoặc báo lỗi nếu là key cuối
        if (attempt === GEMINI_API_KEYS.length - 1) {
          return "❌ Không thể kết nối tới Gemini API. Kiểm tra internet hoặc CORS.";
        }
      } else {
        if (attempt === GEMINI_API_KEYS.length - 1) {
          return `❌ Lỗi: ${err.message}`;
        }
      }
    }
  }

  return "⏳ Tất cả API keys trong danh sách đều đã vượt quá giới hạn quota hoặc không hợp lệ. Vui lòng bổ sung thêm key hoạt động trong file .env.local!";
}
