import AppRouter from '@/router'

/**
 * Root component của ứng dụng.
 *
 * Chỉ khởi tạo Router và các Provider cấp cao nhất.
 * Business logic được xử lý ở từng feature/page component.
 */
const App = () => {
  return <AppRouter />
}

export default App
