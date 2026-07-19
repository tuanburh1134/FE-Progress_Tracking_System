import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'
import type { ApiResponse, PageResponse, RegisterFormData, User, UserRole } from '@/types'
import { STORAGE_KEYS } from '@/constants'
import useAuthStore from '@/store/authStore'

export interface AdminUserFormData extends RegisterFormData {
  role: string
}

const KEY = 'admin_users'

const readUsers = (): User[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as User[]
  } catch {
    return []
  }
}

const writeUsers = (users: User[]) => {
  localStorage.setItem(KEY, JSON.stringify(users))
}

const ensureSeed = () => {
  const existing = readUsers()
    if (existing.length === 0) {
    const seeded: User[] = [
      { id: 1, username: 'admin', email: 'admin@example.com', fullName: 'Admin User', role: 'ADMIN' as UserRole },
      { id: 2, username: 'pm', email: 'pm@example.com', fullName: 'Project Manager', role: 'PROJECT_MANAGER' as UserRole },
      { id: 3, username: 'member', email: 'member@example.com', fullName: 'Team Member', role: 'MEMBER' as UserRole },
    ]
    writeUsers(seeded)
    return seeded
  }
  return existing
}

const adminService = {
  async getUsers(page = 0, size = 50): Promise<User[]> {
    // Try backend first, fallback to localStorage on any error
    try {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        // Log resolved URL and token presence for debugging
        // eslint-disable-next-line no-console
        console.debug('adminService.getUsers -> url:', apiClient.defaults.baseURL + ENDPOINTS.USERS.LIST, 'tokenPresent:', !!token)
      } catch (e) {}
      const response = await apiClient.get<ApiResponse<User[] | PageResponse<User>>>(ENDPOINTS.USERS.LIST, {
        params: { page, size },
      })

      const payload = response.data?.data
      if (Array.isArray(payload)) return payload
      return payload?.content || payload || []
    } catch (err) {
      // Log detailed error to help diagnose why backend cannot be reached
      // eslint-disable-next-line no-console
      console.warn('adminService.getUsers: backend failed, falling back to localStorage', {
        message: (err as any)?.message,
        status: (err as any)?.response?.status,
        data: (err as any)?.response?.data,
      })
      ensureSeed()
      const list = readUsers()
      const start = page * size
      return list.slice(start, start + size)
    }
  },

  async createUser(data: AdminUserFormData): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<User>>(ENDPOINTS.USERS.CREATE, data)
      return response.data?.data
    } catch (err) {
      console.warn('adminService.createUser: backend failed, fallback to localStorage', err)
      ensureSeed()
      const list = readUsers()
      const id = list.length ? Math.max(...list.map((u) => u.id)) + 1 : 1
      const created: User = {
        id,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        role: data.role as UserRole,
      }
      list.unshift(created)
      writeUsers(list)
      return created
    }
  },

  async updateUser(userId: number, data: Partial<AdminUserFormData>): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(ENDPOINTS.USERS.UPDATE_PROFILE(userId), data)
      const updated = response.data?.data

      try {
        const me = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_INFO) || 'null')
        if (me && me.id === updated.id) {
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updated))
          try { useAuthStore.getState().updateUser(updated as Partial<User>) } catch {}
        }
      } catch {}

      return updated
    } catch (err) {
      console.warn('adminService.updateUser: backend failed, fallback to localStorage', err)
      ensureSeed()
      const list = readUsers()
      const idx = list.findIndex((u) => u.id === userId)
      if (idx === -1) throw new Error('User not found')
      const updated = { ...list[idx], ...data }
      list[idx] = updated as User
      writeUsers(list)

      try {
        const me = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_INFO) || 'null')
        if (me && me.id === updated.id) {
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updated))
          try { useAuthStore.getState().updateUser(updated as Partial<User>) } catch {}
        }
      } catch {}

      return updated as User
    }
  },

  async deleteUser(userId: number): Promise<void> {
    try {
      await apiClient.delete(ENDPOINTS.USERS.DETAIL(userId))
    } catch (err) {
      console.warn('adminService.deleteUser: backend failed, fallback to localStorage', err)
      ensureSeed()
      const list = readUsers()
      const filtered = list.filter((u) => u.id !== userId)
      writeUsers(filtered)
    }
  },
}

export default adminService
