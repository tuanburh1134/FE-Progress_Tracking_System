import { useEffect, useState } from "react";
import useAuthStore from "../store/authStore";
import { getDashboardStats } from "../features/dashboard/services/dashboardService";

import StatCard from "../components/StatCard";
import BarChartBox from "../components/BarChartBox";
import PieChartBox from "../components/PieChartBox";
import LineChartBox from "../components/LineChartBox";

// ---------------------------------------------------------------------------
// Skeleton loader cho StatCard
// ---------------------------------------------------------------------------
const StatCardSkeleton = () => (
  <div className="bg-[#0b0f1a] border border-gray-800 rounded-xl p-4 animate-pulse">
    <div className="h-3 w-2/3 bg-gray-700 rounded mb-3" />
    <div className="h-7 w-1/3 bg-gray-600 rounded" />
  </div>
);

// ---------------------------------------------------------------------------
// Skeleton loader cho biểu đồ
// ---------------------------------------------------------------------------
const ChartSkeleton = ({ className = "" }) => (
  <div
    className={`bg-[#0b0f1a] border border-gray-800 rounded-xl p-4 animate-pulse ${className}`}
  >
    <div className="h-3 w-1/3 bg-gray-700 rounded mb-4" />
    <div className="h-56 bg-gray-800 rounded-lg" />
  </div>
);

// ---------------------------------------------------------------------------
// Component chính
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardStats();
        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Lỗi khi tải dashboard stats:", err);
          setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Đang tải bảng điều khiển...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex">

      {/* Main */}
      <div className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bảng Điều Khiển
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Chào mừng trở lại, <span className="text-gray-900 dark:text-white font-semibold">{user?.fullName || user?.username || "bạn"}</span>! Đây là tổng quan dự án của bạn.
          </p>
        </div>

        {/* Lỗi */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Dự Án Đang Hoạt Động"
                value={String(stats?.activeProjects ?? 0)}
              />
              <StatCard
                title="Công Việc Hoàn Thành"
                value={String(stats?.completedTasks ?? 0)}
              />
              <StatCard
                title="Đang Thực Hiện"
                value={String(stats?.inProgressTasks ?? 0)}
              />
              <StatCard
                title="Thành Viên Nhóm"
                value={String(stats?.teamMembers ?? 0)}
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-4">
          {loading ? (
            <>
              <ChartSkeleton className="col-span-2" />
              <ChartSkeleton />
            </>
          ) : (
            <>
              <BarChartBox data={stats?.projectProgress ?? []} />
              <PieChartBox data={stats?.taskStatusBreakdown ?? []} />
            </>
          )}
        </div>

        {/* Line */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <LineChartBox data={stats?.weeklyActivity ?? []} />
        )}

      </div>
    </div>
  );
}

