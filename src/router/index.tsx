import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants'
import useAuthStore from '@/store/authStore'

// Lazy imports để code splitting - giảm bundle size ban đầu
import { lazy, Suspense } from 'react'

// Layout
import AppLayout from '@/components/layout/AppLayout'

// Pages - Lazy loaded
const LoginPage = lazy(() => import('@/features/auth/components/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/components/RegisterPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/components/DashboardPage'))
const ProjectListPage = lazy(() => import('@/features/projects/components/ProjectListPage'))
const ProjectDetailPage = lazy(() => import('@/features/projects/components/ProjectDetailPage'))
const KanbanBoard = lazy(() => import('@/features/tasks/components/KanbanBoard'))
const AiPredictionsPage = lazy(() => import('@/features/ai-prediction/components/AiPredictionsPage'))

/**
 * Component bảo vệ route - redirect về login nếu chưa xác thực.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.LOGIN} replace />
}

/**
 * Component redirect nếu đã đăng nhập (tránh vào login khi đã auth).
 */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.DASHBOARD} replace />
}

/**
 * Cấu hình React Router cho toàn ứng dụng.
 *
 * Cấu trúc route:
 * - Public: /login, /register
 * - Protected (cần auth): tất cả còn lại, wrapped bởi AppLayout
 */
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.LOGIN} element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path={ROUTES.REGISTER} element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected Routes - dùng AppLayout */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.PROJECTS} element={<ProjectListPage />} />
            <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
            <Route path={ROUTES.PROJECT_KANBAN} element={<KanbanBoard />} />
            <Route path={ROUTES.AI_PREDICTIONS} element={<AiPredictionsPage />} />
          </Route>

          {/* Fallback - 404 */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRouter
