/**
 * Định nghĩa các TypeScript types/interfaces dùng chung toàn dự án.
 *
 * Tách biệt types theo domain để dễ import và maintain.
 */

// =============================================================================
// Auth Types
// =============================================================================

export interface User {
  id: number
  username: string
  email: string
  fullName: string
  avatarUrl?: string
  role: UserRole
}

export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'MEMBER'

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  username: string
  email: string
  password: string
  fullName: string
}

// =============================================================================
// Project Types
// =============================================================================

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type ProjectRole = 'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER'

export interface Project {
  id: number
  name: string
  description?: string
  startDate: string // ISO date string
  deadline: string
  status: ProjectStatus
  priority: Priority
  progress: number  // 0-100
  owner: User
  createdAt: string
  updatedAt: string
}

export interface ProjectFormData {
  name: string
  description?: string
  startDate: string
  deadline: string
  priority: Priority
}

// =============================================================================
// Task Types
// =============================================================================

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED'

export interface Task {
  id: number
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  deadline?: string
  estimatedHours?: number
  actualHours?: number
  startDate?: string
  completedDate?: string
  displayOrder: number
  project: Pick<Project, 'id' | 'name'>
  assignee?: User
  createdBy: User
  createdAt: string
  updatedAt: string
}

export interface TaskFormData {
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  deadline?: string
  estimatedHours?: number
  assigneeId?: number
}

// =============================================================================
// API Response Types
// =============================================================================

/** Wrapper chuẩn của mọi response từ backend */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

/** Response phân trang từ Spring Data */
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number       // current page (0-indexed)
  first: boolean
  last: boolean
}

// =============================================================================
// AI Prediction Types
// =============================================================================

export interface RiskPrediction {
  projectId: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  delayProbability: number      // 0.0 - 1.0
  estimatedDelayDays: number
  riskFactors: string[]
  recommendations: string[]
  predictedAt: string
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  overdueProjects: number
  totalTasks: number
  completedTasks: number
  myTasksDueThisWeek: number
}
