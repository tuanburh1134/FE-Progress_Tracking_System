import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

export interface NotificationData {
  id: number
  type: 
    | 'INVITATION_RECEIVED' 
    | 'INVITATION_ACCEPTED' 
    | 'INVITATION_DECLINED'
    | 'TEAM_INVITATION_RECEIVED'
    | 'TEAM_INVITATION_ACCEPTED'
    | 'TEAM_INVITATION_DECLINED'
  message: string
  referenceId?: number
  isRead: boolean
  createdAt: string
}

const notificationService = {
  /** Lấy tất cả thông báo */
  async getNotifications(): Promise<NotificationData[]> {
    const response = await apiClient.get<{ data: NotificationData[] }>(
      ENDPOINTS.NOTIFICATIONS.LIST
    )
    return response.data.data
  },

  /** Đếm số thông báo chưa đọc */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ data: { count: number } }>(
      ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT
    )
    return response.data.data.count
  },

  /** Đánh dấu một thông báo đã đọc */
  async markAsRead(notificationId: number): Promise<void> {
    await apiClient.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId))
  },

  /** Đánh dấu tất cả đã đọc */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ)
  },
}

export default notificationService
