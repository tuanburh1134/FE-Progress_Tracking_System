import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import type { ApiResponse } from '@/types'
import type { UserSearchResult } from './memberService'

export interface TeamResponse {
  id: number
  name: string
  description: string | null
  owner: UserSearchResult
  members: UserSearchResult[]
  memberCount: number
  createdAt: string
}

const teamService = {
  async getMyTeams(page = 0, size = 50): Promise<TeamResponse[]> {
    const response = await apiClient.get<ApiResponse<{ content: TeamResponse[] }>>(
      ENDPOINTS.TEAMS.LIST,
      { params: { page, size } }
    )
    return response.data.data?.content ?? []
  },

  async createTeam(name: string, description: string): Promise<TeamResponse> {
    const response = await apiClient.post<ApiResponse<TeamResponse>>(
      ENDPOINTS.TEAMS.CREATE,
      { name, description }
    )
    return response.data.data
  },

  async getTeamDetail(teamId: number): Promise<TeamResponse> {
    const response = await apiClient.get<ApiResponse<TeamResponse>>(
      ENDPOINTS.TEAMS.DETAIL(teamId)
    )
    return response.data.data
  },

  async addMember(teamId: number, email: string): Promise<UserSearchResult> {
    const response = await apiClient.post<ApiResponse<UserSearchResult>>(
      ENDPOINTS.TEAMS.ADD_MEMBER(teamId),
      { email }
    )
    return response.data.data
  },

  async removeMember(teamId: number, userId: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.TEAMS.REMOVE_MEMBER(teamId, userId))
  },

  async deleteTeam(teamId: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.TEAMS.DELETE(teamId))
  },

  async addMembersFromTeamToProject(projectId: number, teamId: number): Promise<number> {
    const response = await apiClient.post<ApiResponse<number>>(
      ENDPOINTS.TEAMS.ADD_TO_PROJECT(projectId, teamId)
    )
    return response.data.data ?? 0
  }
}

export default teamService
