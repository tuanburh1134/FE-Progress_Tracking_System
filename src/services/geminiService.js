/**
 * AI Chat Service — FreeLLMAPI Proxy (OpenAI-compatible)
 *
 * Thay vì gọi trực tiếp Google Gemini, service này gọi tới FreeLLMAPI
 * đang chạy local tại localhost:3001 — một proxy server tự động luân phiên
 * giữa nhiều API key Google để tránh Rate Limit 429.
 *
 * Chiến lược tiết kiệm token (giữ nguyên):
 * - Dùng model gemini-2.0-flash (rẻ + nhanh nhất)
 * - Giới hạn lịch sử chat: chỉ giữ 4 tin nhắn gần nhất
 * - max_tokens: 400 (đủ để trả lời ngắn gọn)
 * - System prompt cực ngắn
 */

const FREELLMAPI_KEY = import.meta.env.VITE_FREELLMAPI_KEY;
const FREELLMAPI_URL = import.meta.env.VITE_FREELLMAPI_URL || 'http://localhost:3001/v1';

/** Endpoint theo chuẩn OpenAI */
const CHAT_COMPLETIONS_URL = `${FREELLMAPI_URL}/chat/completions`;

/** Model name — dùng model available trong FreeLLMAPI */
const MODEL = 'gemini-2.5-flash';

/** Số tin nhắn lịch sử tối đa gửi kèm (tiết kiệm token) */
const MAX_HISTORY = 4;

/** System prompt ngắn gọn — càng ngắn càng ít token */
const SYSTEM_PROMPT = `Bạn là trợ lý AI của hệ thống quản lý dự án phần mềm. \
Trả lời ngắn gọn, thực tế, tập trung vào quản lý task, tiến độ, phân công công việc. \
Không lan man. Tối đa 3-4 câu mỗi câu trả lời.`;

/**
 * Gọi AI qua FreeLLMAPI (OpenAI-compatible) với lịch sử chat.
 *
 * @param {string} userMessage - Tin nhắn người dùng vừa gửi
 * @param {Array<{role: string, text: string}>} history - Lịch sử hội thoại
 * @param {Object} context - Dữ liệu dự án (tasks, team) để AI hiểu ngữ cảnh
 * @returns {Promise<string>} Câu trả lời từ AI
 */
export async function askGemini(userMessage, history = [], context = {}) {
  if (!FREELLMAPI_KEY) {
    return '⚠️ Chưa cấu hình FreeLLMAPI key. Vui lòng kiểm tra VITE_FREELLMAPI_KEY trong file .env.local';
  }

  // Xây dựng context ngắn gọn từ dữ liệu dự án (giữ nguyên logic cũ)
  let contextStr = '';
  if (context.tasks?.length > 0 || context.team?.length > 0) {
    const doneTasks  = context.tasks?.filter(t => t.status === 'done').length ?? 0;
    const totalTasks = context.tasks?.length ?? 0;
    const overdue    = context.tasks?.filter(t => {
      if (!t.deadline || t.status === 'done') return false;
      return t.deadline <= new Date().toISOString().split('T')[0];
    }).length ?? 0;

    contextStr = `\n[Dự án: ${totalTasks} task, ${doneTasks} xong, ${overdue} trễ hạn, ${context.team?.length ?? 0} thành viên]`;
  }

  // Chỉ lấy MAX_HISTORY tin nhắn gần nhất (tiết kiệm token)
  const recentHistory = history.slice(-MAX_HISTORY);

  // Xây dựng messages theo chuẩn OpenAI
  // System message đặt đầu tiên
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    // Lịch sử hội thoại
    ...recentHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text,
    })),
    // Tin nhắn hiện tại + context dự án
    { role: 'user', content: userMessage + contextStr },
  ];

  try {
    const res = await fetch(CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FREELLMAPI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 400,    // Giới hạn output token
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || res.statusText;

      // 429: Tất cả key đều bị rate limit (rất hiếm vì FreeLLMAPI tự failover)
      if (res.status === 429) {
        return `⏳ Tất cả API key đã vượt giới hạn quota (429).\n\nCách khắc phục:\n1. Thêm API key mới tại http://localhost:3001/keys\n2. Lấy key miễn phí tại https://aistudio.google.com/apikey`;
      }

      // 401/403: Unified key không hợp lệ
      if (res.status === 401 || res.status === 403) {
        return `❌ FreeLLMAPI key không hợp lệ (${res.status}). Kiểm tra VITE_FREELLMAPI_KEY trong .env.local`;
      }

      return `❌ Lỗi FreeLLMAPI (${res.status}): ${msg}`;
    }

    const data = await res.json();
    // OpenAI-compatible response format
    const text = data?.choices?.[0]?.message?.content;

    if (!text) return '❌ AI không trả về nội dung. Thử lại nhé.';
    return text.trim();

  } catch (err) {
    if (err.name === 'TypeError') {
      return '❌ Không thể kết nối tới FreeLLMAPI (localhost:3001). Đảm bảo Docker đang chạy.';
    }
    return `❌ Lỗi: ${err.message}`;
  }
}
