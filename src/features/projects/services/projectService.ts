import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import type { ApiResponse, PageResponse, Project, ProjectFormData } from '@/types'

/**
 * Service xử lý tất cả API calls liên quan đến Projects.
 */
const projectService = {
  /**
   * Lấy danh sách dự án có phân trang.
   *
   * @param page - Số trang (bắt đầu từ 0)
   * @param size - Số item mỗi trang
   * @returns PageResponse<Project>
   */
  async getProjects(page = 0, size = 10): Promise<PageResponse<Project>> {
    const response = await apiClient.get<ApiResponse<PageResponse<Project>>>(
      ENDPOINTS.PROJECTS.LIST,
      { params: { page, size, sort: 'createdAt,desc' } }
    )
    return response.data.data
  },

  /**
   * Lấy chi tiết một dự án.
   *
   * @param projectId - ID dự án
   * @returns Project entity
   */
  async getProjectById(projectId: number): Promise<Project> {
    const response = await apiClient.get<ApiResponse<Project>>(
      ENDPOINTS.PROJECTS.DETAIL(projectId)
    )
    return response.data.data
  },

  /**
   * Tạo dự án mới.
   *
   * @param data - Thông tin dự án
   * @returns Project entity vừa tạo
   */
  async createProject(data: ProjectFormData): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>(
      ENDPOINTS.PROJECTS.CREATE,
      data
    )
    return response.data.data
  },

  /**
   * Cập nhật thông tin dự án.
   *
   * @param projectId - ID dự án
   * @param data      - Thông tin cập nhật
   * @returns Project entity sau cập nhật
   */
  async updateProject(projectId: number, data: ProjectFormData): Promise<Project> {
    const response = await apiClient.put<ApiResponse<Project>>(
      ENDPOINTS.PROJECTS.UPDATE(projectId),
      data
    )
    return response.data.data
  },

  /**
   * Xóa dự án.
   *
   * @param projectId - ID dự án cần xóa
   */
  async deleteProject(projectId: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.PROJECTS.DELETE(projectId))
  },
}

export default projectService
