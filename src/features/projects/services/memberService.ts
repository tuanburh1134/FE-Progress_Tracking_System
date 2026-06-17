import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import type { ApiResponse } from '@/types'

/**
 * Thông tin user trả về khi tìm kiếm để mời vào dự án.
 */
export interface UserSearchResult {
  id: number
  username: string
  fullName: string | null
  email: string
  avatarUrl: string | null
  role: string
}

/**
 * Service xử lý tất cả API calls liên quan đến quản lý thành viên dự án.
 */
const memberService = {
  /**
   * Tìm kiếm user theo email để mời vào dự án.
   *
   * @param email - Chuỗi email cần tìm kiếm (tối thiểu 2 ký tự)
   * @returns Danh sách user phù hợp (tối đa 5 kết quả)
   */
  async searchUsers(email: string): Promise<UserSearchResult[]> {
    if (!email || email.trim().length < 2) return []
    const response = await apiClient.get<ApiResponse<UserSearchResult[]>>(
      ENDPOINTS.USERS.SEARCH,
      { params: { email: email.trim(), size: 5 } }
    )
    return response.data.data ?? []
  },

  /**
   * Lấy danh sách thành viên của dự án.
   *
   * @param projectId - ID dự án
   * @returns Danh sách thành viên
   */
  async getMembers(projectId: number): Promise<UserSearchResult[]> {
    const response = await apiClient.get<ApiResponse<UserSearchResult[]>>(
      ENDPOINTS.PROJECTS.MEMBERS(projectId)
    )
    return response.data.data ?? []
  },

  /**
   * Mời thành viên vào dự án theo email.
   *
   * @param projectId - ID dự án
   * @param email     - Email của người được mời
   * @returns Thông tin user vừa được thêm
   */
  async addMember(projectId: number, email: string): Promise<UserSearchResult> {
    const response = await apiClient.post<ApiResponse<UserSearchResult>>(
      ENDPOINTS.PROJECTS.ADD_MEMBER(projectId),
      { email }
    )
    return response.data.data
  },

  /**
   * Xóa thành viên khỏi dự án.
   *
   * @param projectId - ID dự án
   * @param memberId  - ID của thành viên cần xóa
   */
  async removeMember(projectId: number, memberId: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.PROJECTS.REMOVE_MEMBER(projectId, memberId))
  },
}

export default memberService
