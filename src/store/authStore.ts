import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { STORAGE_KEYS } from '@/constants'

/**
 * Shape của Auth Store.
 */
interface AuthState {
  /** Thông tin user đang đăng nhập */
  user: User | null

  /** JWT access token */
  accessToken: string | null

  /** Trạng thái đang authenticate */
  isAuthenticated: boolean

  // Actions
  /** Lưu thông tin đăng nhập sau khi login/register thành công */
  setAuth: (user: User, accessToken: string) => void

  /** Xóa auth state khi logout */
  clearAuth: () => void

  /** Cập nhật thông tin user (khi update profile) */
  updateUser: (updates: Partial<User>) => void
}

/**
 * Zustand store quản lý trạng thái xác thực.
 *
 * Sử dụng `persist` middleware để lưu vào localStorage,
 * đảm bảo user không bị logout khi refresh trang.
 */
const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true })
      },

      clearAuth: () => {
        // Xóa cả localStorage thủ công để đảm bảo clean
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      updateUser: updates => {
        set(state => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },
    }),
    {
      name: 'auth-storage', // Key trong localStorage
      partialize: state => ({
        // Chỉ persist những field cần thiết
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
