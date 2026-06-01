/**
 * Hằng số dùng chung toàn dự án.
 * Tập trung tại đây để dễ thay đổi và tránh magic strings.
 */

// =============================================================================
// API & App Config
// =============================================================================

/** Base URL của backend Spring Boot API */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

/** Base URL của AI Python FastAPI service */
export const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

/** Tên ứng dụng hiển thị trên UI */
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Project Tracker'

// =============================================================================
// Local Storage Keys
// =============================================================================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'project_tracker_access_token',
  USER_INFO: 'project_tracker_user',
} as const

// =============================================================================
// Pagination Defaults
// =============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50],
} as const

// =============================================================================
// Status Labels (Tiếng Việt)
// =============================================================================

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Lên kế hoạch',
  IN_PROGRESS: 'Đang thực hiện',
  ON_HOLD: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang làm',
  IN_REVIEW: 'Đang review',
  DONE: 'Hoàn thành',
  BLOCKED: 'Bị chặn',
}

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  CRITICAL: 'Khẩn cấp',
}

// =============================================================================
// Colors cho Status & Priority (dùng với Tailwind classes)
// =============================================================================

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-slate-400 bg-slate-400/10',
  MEDIUM: 'text-blue-400 bg-blue-400/10',
  HIGH: 'text-orange-400 bg-orange-400/10',
  CRITICAL: 'text-red-400 bg-red-400/10',
}

export const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: 'text-slate-400 bg-slate-400/10',
  IN_PROGRESS: 'text-blue-400 bg-blue-400/10',
  IN_REVIEW: 'text-purple-400 bg-purple-400/10',
  DONE: 'text-green-400 bg-green-400/10',
  BLOCKED: 'text-red-400 bg-red-400/10',
}

// =============================================================================
// Route Paths
// =============================================================================

export const ROUTES = {
  // Public
  LOGIN: '/login',
  REGISTER: '/register',

  // Protected
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:projectId',
  PROJECT_KANBAN: '/projects/:projectId/kanban',
  TASKS: '/tasks',
  PROFILE: '/profile',

  // AI
  AI_PREDICTIONS: '/ai/predictions',
} as const
