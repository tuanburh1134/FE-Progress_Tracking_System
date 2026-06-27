/**
 * Danh sách tất cả API endpoints của hệ thống.
 *
 * Tập trung tại đây để dễ cập nhật khi backend thay đổi route,
 * tránh hard-code URL rải rác trong codebase.
 */

export const ENDPOINTS = {
  // -------------------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------------------
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------
  USERS: {
    LIST: '/users',
    DETAIL: (id: number) => `/users/${id}`,
    UPDATE_PROFILE: (id: number) => `/users/${id}`,
    UPDATE_AVATAR: (id: number) => `/users/${id}/avatar`,
    SEARCH: '/users/search',
  },

  // -------------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------------
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    DETAIL: (id: number) => `/projects/${id}`,
    UPDATE: (id: number) => `/projects/${id}`,
    // Xóa mềm
    DELETE: (id: number) => `/projects/${id}`,
    
    TRASH: "/projects/trash",
    
    // Khôi phục
    RESTORE: (id: number) => `/projects/${id}/restore`,

    // Xóa vĩnh viễn
    PERMANENT_DELETE: (id: number) => `/projects/${id}/permanent`,
    MEMBERS: (id: number) => `/projects/${id}/members`,
    ADD_MEMBER: (id: number) => `/projects/${id}/members`,
    REMOVE_MEMBER: (projectId: number, userId: number) =>
      `/projects/${projectId}/members/${userId}`,
    STATS: (id: number) => `/projects/${id}/stats`,
  },

  // -------------------------------------------------------------------------
  // Tasks
  // -------------------------------------------------------------------------
  TASKS: {
    LIST: (projectId: number) => `/projects/${projectId}/tasks`,
    CREATE: (projectId: number) => `/projects/${projectId}/tasks`,
    DETAIL: (projectId: number, taskId: number) =>
      `/projects/${projectId}/tasks/${taskId}`,
    UPDATE: (projectId: number, taskId: number) =>
      `/projects/${projectId}/tasks/${taskId}`,
    DELETE: (projectId: number, taskId: number) =>
      `/projects/${projectId}/tasks/${taskId}`,
    UPDATE_STATUS: (projectId: number, taskId: number) =>
      `/projects/${projectId}/tasks/${taskId}/status`,
    REORDER: (projectId: number) => `/projects/${projectId}/tasks/reorder`,
  },

  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------
  DASHBOARD: {
    STATS: '/dashboard/stats',
    RECENT_ACTIVITIES: '/dashboard/activities',
    MY_TASKS: '/dashboard/my-tasks',
  },

  // -------------------------------------------------------------------------
  // AI Service (Python FastAPI - port 8000)
  // -------------------------------------------------------------------------
  AI: {
    PREDICT_PROJECT: (projectId: number) => `/predict/project/${projectId}`,
    PREDICT_BATCH: '/predict/batch',
    TRAINING_STATUS: '/model/status',
  },
} as const
