import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import type { ApiResponse, Task, TaskFormData } from '@/types'

/**
 * Service xử lý tất cả API calls liên quan đến Tasks.
 */
const taskService = {
  /**
   * Lấy tất cả task của một dự án (dùng cho Kanban board).
   *
   * @param projectId - ID dự án
   * @returns Danh sách task đã sắp xếp theo status và displayOrder
   */
  async getTasksByProject(projectId: number): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>(
      ENDPOINTS.TASKS.LIST(projectId)
    )
    return response.data.data
  },

  /**
   * Tạo task mới trong dự án.
   *
   * @param projectId - ID dự án chứa task
   * @param data      - Thông tin task
   * @returns Task entity vừa tạo
   */
  async createTask(projectId: number, data: TaskFormData): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(
      ENDPOINTS.TASKS.CREATE(projectId),
      data
    )
    return response.data.data
  },

  /**
   * Cập nhật thông tin task.
   *
   * @param projectId - ID dự án
   * @param taskId    - ID task
   * @param data      - Thông tin cập nhật
   * @returns Task entity sau cập nhật
   */
  async updateTask(projectId: number, taskId: number, data: Partial<TaskFormData>): Promise<Task> {
    const response = await apiClient.put<ApiResponse<Task>>(
      ENDPOINTS.TASKS.UPDATE(projectId, taskId),
      data
    )
    return response.data.data
  },

  /**
   * Cập nhật nhanh trạng thái task (khi kéo thả Kanban).
   *
   * @param projectId - ID dự án
   * @param taskId    - ID task
   * @param status    - Trạng thái mới
   * @returns Task entity sau cập nhật
   */
  async updateTaskStatus(
    projectId: number,
    taskId: number,
    status: Task['status']
  ): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<Task>>(
      ENDPOINTS.TASKS.UPDATE_STATUS(projectId, taskId),
      { status }
    )
    return response.data.data
  },

  /**
   * Xóa task.
   *
   * @param projectId - ID dự án
   * @param taskId    - ID task cần xóa
   */
  async deleteTask(projectId: number, taskId: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.TASKS.DELETE(projectId, taskId))
  },
}

export default taskService
