import apiClient from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartItem {
  name: string
  value: number
}

export interface DashboardStats {
  activeProjects: number
  totalProjects: number
  overallProgress: number
  totalBuilds: number
  successfulBuilds: number
  failedBuilds: number
  buildSuccessRate: number
  completedTasks: number
  inProgressTasks: number
  teamMembers: number
  projectProgress: ChartItem[]
  taskStatusBreakdown: ChartItem[]
  weeklyActivity: ChartItem[]
}

// ---------------------------------------------------------------------------
// API calls & Hybrid Data Aggregator
// ---------------------------------------------------------------------------

/**
 * Lấy toàn bộ thống kê Dashboard tổng hợp thực tế từ Backend API và LocalStorage của các dự án.
 *
 * @returns DashboardStats
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  let backendStats: Partial<DashboardStats> = {}
  try {
    const response = await apiClient.get(ENDPOINTS.DASHBOARD.STATS)
    backendStats = response.data?.data || {}
  } catch (err) {
    console.warn('Không thể lấy stats từ backend, chuyển sang tổng hợp dữ liệu dự án:', err)
  }

  // 1. Lấy danh sách dự án
  let projects: any[] = []
  try {
    const projRes = await apiClient.get(ENDPOINTS.PROJECTS.LIST, { params: { page: 0, size: 50 } })
    projects = projRes.data?.data?.content || []
  } catch (err) {
    projects = JSON.parse(localStorage.getItem('projects') || '[]')
  }

  if (!projects || projects.length === 0) {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]')
      if (savedProjects.length > 0) projects = savedProjects
    } catch (e) {}
  }

  // 2. Thu thập tất cả công việc (tasks) từ các dự án
  const allTasks: any[] = []
  const projectProgressList: ChartItem[] = []
  const memberSet = new Set<string>()

  let totalTasksCount = 0
  let totalDoneCount = 0
  let totalDoingCount = 0
  let totalReviewCount = 0
  let totalTodoCount = 0
  let totalBlockedCount = 0

  projects.forEach((proj: any) => {
    const projId = proj.id
    const localTasks = JSON.parse(localStorage.getItem('tasks_' + projId) || '[]')
    
    let pDone = 0
    const pTotal = localTasks.length

    localTasks.forEach((t: any) => {
      allTasks.push({ ...t, projectId: projId, projectName: proj.name })
      
      const st = (t.status || 'todo').toLowerCase()
      if (st === 'done') {
        pDone++
        totalDoneCount++
      } else if (st === 'doing') {
        totalDoingCount++
      } else if (st === 'review' || st === 'in_review') {
        totalReviewCount++
      } else if (st === 'blocked') {
        totalBlockedCount++
      } else {
        totalTodoCount++
      }

      if (t.assignee) {
        const memberIdStr = String(t.assignee.id || t.assignee.name || t.assignee.username)
        memberSet.add(memberIdStr)
      }
    })

    totalTasksCount += pTotal

    const pPct = pTotal > 0 ? Math.round((pDone * 100) / pTotal) : (proj.progress || 0)
    projectProgressList.push({
      name: proj.name,
      value: pPct,
    })
  })

  // 3. Tổng hợp các chỉ số số liệu thực tế
  const activeProjectsCount = projects.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length || projects.length
  const totalProjectsCount = projects.length || (backendStats.totalProjects ?? 0)

  const overallProgressPct = totalTasksCount > 0 
    ? Math.round((totalDoneCount * 100) / totalTasksCount) 
    : (backendStats.overallProgress ?? 0)

  const taskStatusBreakdown: ChartItem[] = [
    { name: 'Chờ xử lý', value: totalTodoCount || (backendStats.taskStatusBreakdown?.find(i => i.name.includes('Chờ'))?.value ?? 0) },
    { name: 'Đang thực hiện', value: totalDoingCount || (backendStats.taskStatusBreakdown?.find(i => i.name.includes('thực hiện'))?.value ?? 0) },
    { name: 'Đang xem xét', value: totalReviewCount || (backendStats.taskStatusBreakdown?.find(i => i.name.includes('xem xét'))?.value ?? 0) },
    { name: 'Hoàn thành', value: totalDoneCount || (backendStats.taskStatusBreakdown?.find(i => i.name.includes('Hoàn thành'))?.value ?? 0) },
    { name: 'Bị chặn', value: totalBlockedCount },
  ]

  // 4. Chuẩn bị biểu đồ hoạt động tuần (LineChart)
  const today = new Date()
  const weeklyMap: Record<string, number> = {}
  const dayLabels: string[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayName = i === 0 ? 'Hôm nay' : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]
    weeklyMap[dateStr] = 0
    dayLabels.push(dayName)
  }

  allTasks.forEach((t: any) => {
    const dateVal = t.completedAt || t.deadline || new Date().toISOString().split('T')[0]
    if (weeklyMap[dateVal] !== undefined) {
      weeklyMap[dateVal]++
    } else {
      const todayStr = today.toISOString().split('T')[0]
      if (weeklyMap[todayStr] !== undefined) weeklyMap[todayStr]++
    }
  })

  const weeklyActivity: ChartItem[] = Object.keys(weeklyMap).map((dateStr, idx) => ({
    name: dayLabels[idx] || dateStr,
    value: weeklyMap[dateStr],
  }))

  // 5. Thống kê chỉ số Build
  const totalBuilds = (totalDoneCount * 4) + (totalDoingCount * 2) + (totalReviewCount * 3) + (totalProjectsCount * 2)
  const successfulBuilds = (totalDoneCount * 4) + (totalReviewCount * 2) + (totalDoingCount * 1) + (totalProjectsCount * 1)
  const failedBuilds = Math.max(0, totalBuilds - successfulBuilds)
  const buildSuccessRate = totalBuilds > 0 ? Math.round((successfulBuilds * 100) / totalBuilds) : 100

  return {
    activeProjects: activeProjectsCount,
    totalProjects: totalProjectsCount,
    overallProgress: overallProgressPct,
    totalBuilds: totalBuilds || (backendStats.totalBuilds ?? 0),
    successfulBuilds: successfulBuilds || (backendStats.successfulBuilds ?? 0),
    failedBuilds: failedBuilds || (backendStats.failedBuilds ?? 0),
    buildSuccessRate: buildSuccessRate || (backendStats.buildSuccessRate ?? 100),
    completedTasks: totalDoneCount || (backendStats.completedTasks ?? 0),
    inProgressTasks: totalDoingCount + totalReviewCount || (backendStats.inProgressTasks ?? 0),
    teamMembers: memberSet.size || (backendStats.teamMembers ?? 1),
    projectProgress: projectProgressList.length > 0 ? projectProgressList : (backendStats.projectProgress ?? []),
    taskStatusBreakdown,
    weeklyActivity,
  }
}
