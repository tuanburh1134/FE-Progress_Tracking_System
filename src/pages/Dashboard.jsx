import { useEffect, useState } from "react";
import useAuthStore from "../store/authStore";
import { getDashboardStats } from "../features/dashboard/services/dashboardService";

import StatCard from "../components/StatCard";
import BarChartBox from "../components/BarChartBox";
import PieChartBox from "../components/PieChartBox";
import LineChartBox from "../components/LineChartBox";

import {
  FiBriefcase,
  FiLayers,
  FiTrendingUp,
  FiActivity,
  FiCheckCircle,
  FiUsers,
  FiCheck,
  FiXCircle,
  FiPercent,
  FiClock,
} from "react-icons/fi";

// ---------------------------------------------------------------------------
// Skeleton loader cho StatCard
// ---------------------------------------------------------------------------
const StatCardSkeleton = () => (
  <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-4 animate-pulse space-y-3">
    <div className="h-3 w-2/3 bg-gray-700 rounded" />
    <div className="h-7 w-1/3 bg-gray-600 rounded" />
    <div className="h-2 w-1/2 bg-gray-800 rounded" />
  </div>
);

// ---------------------------------------------------------------------------
// Skeleton loader cho biểu đồ
// ---------------------------------------------------------------------------
const ChartSkeleton = ({ className = "" }) => (
  <div
    className={`bg-[#0b0f1a] border border-gray-800 rounded-2xl p-5 animate-pulse ${className}`}
  >
    <div className="h-4 w-1/3 bg-gray-700 rounded mb-4" />
    <div className="h-56 bg-gray-800/60 rounded-xl" />
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
          setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại.");
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

  const totalBuilds = stats?.totalBuilds ?? 0;
  const successfulBuilds = stats?.successfulBuilds ?? 0;
  const failedBuilds = stats?.failedBuilds ?? 0;
  const buildSuccessRate = stats?.buildSuccessRate ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bảng Điều Khiển
        </h1>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Chào mừng trở lại,{" "}
          <span className="text-gray-900 dark:text-white font-semibold">
            {user?.fullName || user?.username || "bạn"}
          </span>
          ! Đây là các chỉ số thực tế về dự án và hoạt động của bạn.
        </p>
      </div>

      {/* Lỗi */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* ── GRID CARD THỐNG KÊ THỰC (6 CARDS) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* 1. Dự án đang làm */}
            <StatCard
              title="Dự Án Đang Làm"
              value={String(stats?.activeProjects ?? 0)}
              subtext="Đang hoạt động"
              icon={<FiBriefcase />}
              color="blue"
            />

            {/* 2. Tổng số dự án đã làm từ trước tới nay */}
            <StatCard
              title="Tổng Số Dự Án"
              value={String(stats?.totalProjects ?? 0)}
              subtext="Đã làm từ trước tới nay"
              icon={<FiLayers />}
              color="purple"
            />

            {/* 3. Tiến độ chung của dự án */}
            <StatCard
              title="Tiến Độ Chung"
              value={`${stats?.overallProgress ?? 0}%`}
              subtext="Tỷ lệ hoàn thành công việc"
              icon={<FiTrendingUp />}
              color="teal"
            />

            {/* 4. Tổng số Build */}
            <StatCard
              title="Tổng Số Build"
              value={String(totalBuilds)}
              subtext={`Thành công: ${successfulBuilds} | Thất bại: ${failedBuilds}`}
              icon={<FiActivity />}
              color="amber"
            />

            {/* 5. Công việc hoàn thành */}
            <StatCard
              title="CV Hoàn Thành"
              value={String(stats?.completedTasks ?? 0)}
              subtext="Task trạng thái DONE"
              icon={<FiCheckCircle />}
              color="green"
            />

            {/* 6. Thành viên nhóm */}
            <StatCard
              title="Thành Viên Nhóm"
              value={String(stats?.teamMembers ?? 0)}
              subtext="Đồng nghiệp tham gia"
              icon={<FiUsers />}
              color="blue"
            />
          </>
        )}
      </div>

      {/* ── BẢNG THỐNG KÊ CHI TIẾT BUILD ── */}
      {!loading && (
        <div className="bg-white dark:bg-[#0b0f1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <FiActivity className="text-base" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Thống Kê Tình Trạng Build Hợp Nhất
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tổng hợp số lần build thành công và thất bại trên tổng số build
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                Tỷ lệ thành công: {buildSuccessRate}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">
                  Tổng Số Build
                </p>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-1">
                  {totalBuilds} <span className="text-xs font-medium text-gray-400">lần</span>
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl text-lg">
                <FiActivity />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase">
                  Build Thành Công
                </p>
                <p className="text-xl font-black text-green-600 dark:text-green-400 mt-1">
                  {successfulBuilds} <span className="text-xs font-medium opacity-80">lần</span>
                </p>
              </div>
              <div className="p-3 bg-green-500/10 text-green-500 rounded-xl text-lg">
                <FiCheck />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase">
                  Build Thất Bại
                </p>
                <p className="text-xl font-black text-red-600 dark:text-red-400 mt-1">
                  {failedBuilds} <span className="text-xs font-medium opacity-80">lần</span>
                </p>
              </div>
              <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-lg">
                <FiXCircle />
              </div>
            </div>
          </div>

          {/* Thanh Tiến Độ Build Rate */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-500 dark:text-gray-400">Tỷ lệ Build Thành Công</span>
              <span className="text-green-500">{buildSuccessRate}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 h-full transition-all duration-700"
                style={{ width: `${buildSuccessRate}%` }}
              />
              <div
                className="bg-red-500 h-full transition-all duration-700"
                style={{ width: `${100 - buildSuccessRate}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── BIỂU ĐỒ TIẾN ĐỘ VÀ PHÂN BỔ TRẠNG THÁI ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <>
            <ChartSkeleton className="col-span-2" />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* BarChart: Tiến Độ Từng Dự Án (%) */}
            <BarChartBox data={stats?.projectProgress ?? []} />

            {/* PieChart: Trạng Thái Công Việc */}
            <PieChartBox data={stats?.taskStatusBreakdown ?? []} />
          </>
        )}
      </div>

      {/* ── BIỂU ĐỒ HOẠT ĐỘNG HOÀN THÀNH THEO NGÀY ── */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <LineChartBox data={stats?.weeklyActivity ?? []} />
      )}
    </div>
  );
}
