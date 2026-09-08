import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

export interface TeamMemberData {
  id: number
  teamId: number
  teamName: string
  userId: number
  userName: string
  userEmail: string
  userAvatar?: string
  inviterId: number
  inviterName: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  invitedAt: string
  respondedAt?: string
}

export interface TeamData {
  id: number
  name: string
  createdAt: string
  ownerId: number
  ownerName: string
  ownerAvatar?: string
  memberCount: number
  members?: TeamMemberData[]
}

export interface UserSearchResult {
  id: number
  username: string
  email: string
  fullName: string
  avatarUrl?: string
}

const teamService = {
  /** Tạo nhóm mới */
  async createTeam(name: string): Promise<TeamData> {
    const response = await apiClient.post<{ data: TeamData }>(
      ENDPOINTS.TEAMS.CREATE,
      { name }
    )
    return response.data.data
  },

  /** Lấy danh sách nhóm của user hiện tại */
  async getMyTeams(): Promise<TeamData[]> {
    const response = await apiClient.get<{ data: TeamData[] }>(
      ENDPOINTS.TEAMS.LIST
    )
    return response.data.data
  },

  /** Lấy danh sách thành viên nhóm */
  async getTeamMembers(teamId: number): Promise<TeamMemberData[]> {
    const response = await apiClient.get<{ data: TeamMemberData[] }>(
      ENDPOINTS.TEAMS.MEMBERS(teamId)
    )
    return response.data.data
  },

  /** Mời thành viên vào nhóm qua email */
  async inviteMember(teamId: number, email: string): Promise<TeamMemberData> {
    const response = await apiClient.post<{ data: TeamMemberData }>(
      ENDPOINTS.TEAMS.INVITE(teamId),
      { email }
    )
    return response.data.data
  },

  /** Lấy danh sách lời mời nhóm đang chờ (PENDING) dành cho user hiện tại */
  async getPendingInvitations(): Promise<TeamMemberData[]> {
    const response = await apiClient.get<{ data: TeamMemberData[] }>(
      ENDPOINTS.TEAMS.PENDING_INVITATIONS
    )
    return response.data.data
  },

  /** Chấp nhận lời mời vào nhóm */
  async acceptInvitation(teamMemberId: number): Promise<void> {
    await apiClient.post(ENDPOINTS.TEAMS.ACCEPT_INVITATION(teamMemberId))
  },

  /** Từ chối lời mời vào nhóm */
  async declineInvitation(teamMemberId: number): Promise<void> {
    await apiClient.post(ENDPOINTS.TEAMS.DECLINE_INVITATION(teamMemberId))
  },

  /** Tìm kiếm người dùng theo email (tối thiểu 2 ký tự) */
  async searchUsersByEmail(email: string): Promise<UserSearchResult[]> {
    if (!email || email.trim().length < 2) return []
    const response = await apiClient.get<{ data: UserSearchResult[] }>(
      ENDPOINTS.USERS.SEARCH,
      { params: { email: email.trim() } }
    )
    return response.data.data
  },
}

export default teamService
