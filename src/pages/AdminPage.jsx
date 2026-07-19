import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiSearch, FiUser, FiLock, FiUnlock, FiTrash2, FiEdit3 } from 'react-icons/fi'
import useAuthStore from '../store/authStore'
import adminService from '../features/admin/services/adminService'
import { getDashboardStats } from '../features/dashboard/services/dashboardService'
import { STORAGE_KEYS } from '../constants'

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'PROJECT_MANAGER', label: 'PROJECT_MANAGER' },
  { value: 'MEMBER', label: 'TEAM_MEMBER' },
]

const STATUS_LABELS = {
  active: 'Kích hoạt',
  locked: 'Khóa',
}

const STATUS_CLASSES = {
  active: 'bg-green-100 text-green-700',
  locked: 'bg-red-100 text-red-700',
}

const UserRow = ({ user, onEdit, onDelete, onToggleLock }) => (
  <tr className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5">
    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{user.fullName || user.username}</td>
    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{user.email}</td>
    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{user.role}</td>
    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASSES[user.locked ? 'locked' : 'active']}`}>
        {user.locked ? STATUS_LABELS.locked : STATUS_LABELS.active}
      </span>
    </td>
    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 space-x-2">
      <button
        onClick={() => onEdit(user)}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-500 bg-blue-600 px-3 py-2 text-white hover:bg-blue-500 transition"
      >
        <FiEdit3 /> Sửa
      </button>
      <button
        onClick={() => onToggleLock(user)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white dark:bg-[#0f172a] px-3 py-2 text-gray-700 hover:bg-gray-100 dark:hover:bg-white/5 transition"
      >
        {user.locked ? <><FiUnlock /> Mở khóa</> : <><FiLock /> Khóa</>}
      </button>
      <button
        onClick={() => onDelete(user)}
        className="inline-flex items-center gap-2 rounded-lg border border-red-500 bg-red-600 px-3 py-2 text-white hover:bg-red-500 transition"
      >
        <FiTrash2 /> Xóa
      </button>
    </td>
  </tr>
)

const AdminPage = () => {
  const currentUser = useAuthStore((s) => s.user)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formState, setFormState] = useState({
    fullName: '',
    username: '',
    email: '',
    role: 'MEMBER',
    password: '',
  })
  const [stats, setStats] = useState(null)
  const [lastErrorDetail, setLastErrorDetail] = useState(null)
  const navigate = useNavigate()

  const fetchData = async () => {
    setLoading(true)
    setError('')
    setLastErrorDetail(null)

    try {
      const [usersResult, statsResult] = await Promise.allSettled([
        adminService.getUsers(),
        getDashboardStats(),
      ])

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value)
      } else {
        console.error('Admin user list load error:', usersResult.reason)
        setLastErrorDetail(usersResult.reason?.response?.data || String(usersResult.reason))
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value)
      } else {
        console.error('Admin dashboard stats load error:', statsResult.reason)
        setLastErrorDetail((prev) => prev || statsResult.reason?.response?.data || String(statsResult.reason))
      }

      if (!usersResult || usersResult.status !== 'fulfilled') {
        setError('Không thể tải danh sách người dùng quản trị. Vui lòng thử lại.')
      }
    } catch (err) {
      console.error('Unexpected admin data load error:', err)
      setError('Không thể tải dữ liệu quản trị. Vui lòng thử lại.')
      setLastErrorDetail(err?.response?.data || String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

    if (!accessToken) {
      navigate('/dashboard')
      return
    }

    const persistedUser = (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_INFO) || 'null')
      } catch {
        return null
      }
    })()

    const userToCheck = currentUser || persistedUser

    if (!userToCheck) return
    if (userToCheck.role !== 'ADMIN') {
      navigate('/dashboard')
      return
    }

    fetchData()
  }, [currentUser, navigate])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const term = search.toLowerCase().trim()
      if (!term) return true
      return (
        user.fullName?.toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term)
      )
    })
  }, [search, users])

  const handleEdit = (user) => {
    setSelectedUser(user)
    setFormState({
      fullName: user.fullName || '',
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'MEMBER',
      password: '',
    })
    setIsEditing(true)
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Xóa người dùng ${user.fullName || user.username}?`)) return
    try {
      await adminService.deleteUser(user.id)
      setUsers((prev) => prev.filter((item) => item.id !== user.id))
    } catch (err) {
      console.error(err)
      alert('Xóa người dùng thất bại.')
    }
  }

  const handleToggleLock = async (user) => {
    try {
      const updated = await adminService.updateUser(user.id, {
        locked: !user.locked,
      })
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      console.error(err)
      alert('Cập nhật trạng thái tài khoản thất bại.')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const payload = {
      fullName: formState.fullName.trim(),
      username: formState.username.trim(),
      email: formState.email.trim(),
      role: formState.role,
      ...(isEditing ? {} : { password: formState.password }),
    }

    try {
      if (isEditing && selectedUser) {
        const updated = await adminService.updateUser(selectedUser.id, payload)
        setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))

        if (updated.id === currentUser?.id) {
          useAuthStore.getState().updateUser(updated)
        }
      } else {
        const created = await adminService.createUser(payload)
        setUsers((prev) => [created, ...prev])
      }

      setIsEditing(false)
      setSelectedUser(null)
      setFormState({ fullName: '', email: '', role: 'TEAM_MEMBER', password: '' })
    } catch (err) {
      console.error(err)
      alert('Lưu người dùng thất bại. Vui lòng kiểm tra dữ liệu.')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#070a12] text-gray-900 dark:text-white p-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
            Quản lý người dùng, Bạn có thể xem danh sách, sửa quyền, khóa/mở khóa tài khoản.
          </p>
        </div>

        <button
          onClick={() => {
            setIsEditing(false)
            setSelectedUser(null)
            setFormState({ fullName: '', email: '', role: 'TEAM_MEMBER', password: '' })
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500"
        >
          <FiPlus /> Thêm người dùng
        </button>
      </div>
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{error}</div>
              {lastErrorDetail && (
                <pre className="mt-2 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(lastErrorDetail)}</pre>
              )}
            </div>
            <div>
              <button
                onClick={() => fetchData()}
                className="ml-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-[#0b1220]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Người dùng</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Tổng số người dùng: {users.length}
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm người dùng..."
                  className="w-full rounded-2xl border border-gray-200 bg-gray-100 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-[#0d172b] dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
                <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Họ tên</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Trạng thái</th>
                    <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Đang tải danh sách người dùng...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Không tìm thấy người dùng.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleLock={handleToggleLock}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-[#0b1220]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Người dùng</p>
              <p className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{users.length}</p>
            </div>
            <div className="rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-[#0b1220]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Dự án đang hoạt động</p>
              <p className="mt-3 text-3xl font-semibold text-blue-600 dark:text-blue-400">{stats?.activeProjects ?? '—'}</p>
            </div>
            <div className="rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-[#0b1220]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Task hoàn thành</p>
              <p className="mt-3 text-3xl font-semibold text-green-600 dark:text-green-400">{stats?.completedTasks ?? '—'}</p>
            </div>
            <div className="rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-[#0b1220]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Dự án quá hạn</p>
              <p className="mt-3 text-3xl font-semibold text-red-600 dark:text-red-400">{stats?.overdueProjects ?? '—'}</p>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-[#0b1220]">
            <h2 className="text-xl font-semibold">{isEditing ? 'Sửa người dùng' : 'Thêm người dùng'}</h2>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Họ tên</label>
                <input
                  type="text"
                  value={formState.fullName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Nhập họ tên"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-100 py-3 px-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-[#121f36] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Tên đăng nhập</label>
                <input
                  type="text"
                  value={formState.username}
                  onChange={(e) => setFormState((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="Nhập tên đăng nhập"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-100 py-3 px-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-[#121f36] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Nhập email"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-100 py-3 px-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-[#121f36] dark:text-white"
                />
              </div>

              {!isEditing && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu</label>
                  <input
                    type="password"
                    value={formState.password}
                    onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Mật khẩu người dùng"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-100 py-3 px-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-[#121f36] dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chỉ nhập mật khẩu khi tạo người dùng mới.</p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select
                  value={formState.role}
                  onChange={(e) => setFormState((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-100 py-3 px-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-[#121f36] dark:text-white"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {isEditing ? 'Cập nhật người dùng' : 'Tạo người dùng'}
              </button>
            </form>
          </div>
        </aside>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}
    </div>
  )
}

export default AdminPage
