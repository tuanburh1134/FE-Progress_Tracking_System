import { useEffect, useState } from "react";

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
  { name: "Todo", value: 2 },
  { name: "In Progress", value: 2 },
  { name: "Review", value: 1 },
  { name: "Done", value: 2 },
];

const lineData = [
  { name: "Mon", value: 12 },
  { name: "Tue", value: 18 },
  { name: "Wed", value: 14 },
  { name: "Thu", value: 25 },
  { name: "Fri", value: 22 },
  { name: "Sat", value: 10 },
  { name: "Sun", value: 6 },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* Main */}
      <div className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Dashboard
          </h1>

          <p className="text-gray-400 mt-1">
            Welcome back, duong24072005! Here's your project overview.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard title="Active Projects" value="2" />
          <StatCard title="Completed Tasks" value="2" />
          <StatCard title="In Progress" value="5" />
          <StatCard title="Team Members" value="4" />
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