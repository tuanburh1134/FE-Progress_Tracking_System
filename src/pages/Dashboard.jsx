import { useEffect, useState } from "react";
import useAuthStore from "../store/authStore";

import StatCard from "../components/StatCard";
import BarChartBox from "../components/BarChartBox";
import PieChartBox from "../components/PieChartBox";
import LineChartBox from "../components/LineChartBox";

const barData = [
  { name: "Mobile", value: 65 },
  { name: "Backend", value: 45 },
  { name: "Marketing", value: 20 },
];

const pieData = [
  { name: "Chờ xử lý", value: 2 },
  { name: "Đang thực hiện", value: 2 },
  { name: "Đang xem xét", value: 1 },
  { name: "Hoàn thành", value: 2 },
];

const lineData = [
  { name: "T2", value: 12 },
  { name: "T3", value: 18 },
  { name: "T4", value: 14 },
  { name: "T5", value: 25 },
  { name: "T6", value: 22 },
  { name: "T7", value: 10 },
  { name: "CN", value: 6 },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
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

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard title="Dự Án Đang Hoạt Động" value="2" />
          <StatCard title="Công Việc Hoàn Thành" value="2" />
          <StatCard title="Đang Thực Hiện" value="5" />
          <StatCard title="Thành Viên Nhóm" value="4" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-4">
          <BarChartBox data={barData} />
          <PieChartBox data={pieData} />
        </div>

        {/* Line */}
        <LineChartBox data={lineData} />

      </div>
    </div>
  );
}

