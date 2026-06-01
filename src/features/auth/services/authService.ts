import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import type { ApiResponse, AuthResponse, LoginFormData, RegisterFormData } from '@/types'
import { STORAGE_KEYS } from '@/constants'

/**
 * Service xử lý tất cả API calls liên quan đến xác thực.
 */
const authService = {
  /**
   * Gọi API đăng nhập, lưu token vào localStorage.
   *
   * @param data - Email và password
   * @returns AuthResponse với token và thông tin user
   */
  async login(data: LoginFormData): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      ENDPOINTS.AUTH.LOGIN,
      data
    )
    const authData = response.data.data
    // Lưu token để dùng cho các request tiếp theo
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken)
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(authData.user))
    return authData
  },

  /**
   * Gọi API đăng ký tài khoản mới.
   *
   * @param data - Thông tin đăng ký
   * @returns AuthResponse với token (đăng nhập ngay sau đăng ký)
   */
  async register(data: RegisterFormData): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      ENDPOINTS.AUTH.REGISTER,
      data
    )
    const authData = response.data.data
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken)
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(authData.user))
    return authData
  },

  /**
   * Xóa token và thông tin user khỏi localStorage.
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_INFO)
  },

  /**
   * Kiểm tra user có đang đăng nhập không.
   *
   * @returns true nếu có token trong localStorage
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  },
}

export default authService
