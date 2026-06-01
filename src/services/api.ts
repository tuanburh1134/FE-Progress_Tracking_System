import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { STORAGE_KEYS, API_BASE_URL } from '@/constants'

/**
 * Axios instance được cấu hình sẵn với:
 * - Base URL từ biến môi trường
 * - Request interceptor: tự động đính kèm JWT token
 * - Response interceptor: xử lý lỗi 401 (token hết hạn)
 *
 * Tất cả API call nên dùng instance này thay vì axios gốc.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 giây timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// =============================================================================
// Request Interceptor - Đính kèm JWT token vào mọi request
// =============================================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// =============================================================================
// Response Interceptor - Xử lý lỗi toàn cục
// =============================================================================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  error => {
    const status = error.response?.status

    // 401: Token hết hạn hoặc không hợp lệ → logout
    if (status === 401) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_INFO)
      // Redirect về login (tránh import circular, dùng window.location)
      window.location.href = '/login'
    }

    // 403: Không có quyền
    if (status === 403) {
      console.error('Không có quyền truy cập tài nguyên này')
    }

    return Promise.reject(error)
  }
)

export default apiClient
