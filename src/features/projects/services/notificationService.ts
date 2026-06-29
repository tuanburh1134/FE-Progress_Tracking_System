import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import type { ApiResponse } from '@/types'

export interface NotificationResponse {
  id: number
  type: 'ADDED_TO_TEAM' | 'ADDED_TO_PROJECT'
  message: string
  read: boolean
  refId: number | null
  createdAt: string
}

const notificationService = {
  async getNotifications(): Promise<NotificationResponse[]> {
    const response = await apiClient.get<ApiResponse<NotificationResponse[]>>(
      ENDPOINTS.NOTIFICATIONS.LIST
    )
    return response.data.data ?? []
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      '/notifications/count'
    )
    return response.data.data?.count ?? 0
  },

  async markAllRead(): Promise<void> {
    await apiClient.put(ENDPOINTS.NOTIFICATIONS.READ_ALL)
  }
}

export default notificationService
