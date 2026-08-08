import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

export interface InvitationData {
  id: number
  projectId: number
  projectName: string
  projectCode?: string
  inviterName: string
  inviterAvatar?: string
  inviteeEmail: string
  inviteeName: string
  inviteeAvatar?: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  createdAt: string
  respondedAt?: string
}

const invitationService = {
  /** Lấy danh sách lời mời PENDING dành cho user hiện tại */
  async getPendingInvitations(): Promise<InvitationData[]> {
    const response = await apiClient.get<{ data: InvitationData[] }>(
      ENDPOINTS.INVITATIONS.PENDING
    )
    return response.data.data
  },

  /** Lấy danh sách lời mời PENDING của một project (owner xem) */
  async getProjectPendingInvitations(projectId: number): Promise<InvitationData[]> {
    const response = await apiClient.get<{ data: InvitationData[] }>(
      ENDPOINTS.INVITATIONS.PROJECT_PENDING(projectId)
    )
    return response.data.data
  },

  /** Chấp nhận lời mời */
  async acceptInvitation(invitationId: number): Promise<void> {
    await apiClient.post(ENDPOINTS.INVITATIONS.ACCEPT(invitationId))
  },

  /** Từ chối lời mời */
  async declineInvitation(invitationId: number): Promise<void> {
    await apiClient.post(ENDPOINTS.INVITATIONS.DECLINE(invitationId))
  },
}

export default invitationService
