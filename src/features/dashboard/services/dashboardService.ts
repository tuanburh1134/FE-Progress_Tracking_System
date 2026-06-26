import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartItem {
  name: string
  value: number
}

export interface DashboardStats {
  activeProjects: number
  completedTasks: number
  inProgressTasks: number
  teamMembers: number
  projectProgress: ChartItem[]
  taskStatusBreakdown: ChartItem[]
  weeklyActivity: ChartItem[]
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Lấy toàn bộ thống kê Dashboard thực từ database theo user đang đăng nhập.
 *
 * @returns DashboardStats
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get(ENDPOINTS.DASHBOARD.STATS)
  // Backend bọc trong ApiResponse { success, data, message }
  return response.data.data as DashboardStats
}
