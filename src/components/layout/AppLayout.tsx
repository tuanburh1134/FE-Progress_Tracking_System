import { Outlet } from 'react-router-dom'

/**
 * Layout chính của ứng dụng - chứa Sidebar, Header và nội dung trang.
 *
 * TODO: Implement đầy đủ Sidebar và Header trong các sprint tiếp theo.
 */
const AppLayout = () => {
  return (
    <div className="app-layout">
      {/* TODO: Thêm Sidebar */}
      {/* TODO: Thêm Header */}
      <main className="main-content">
        {/* Outlet render các page component con */}
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
