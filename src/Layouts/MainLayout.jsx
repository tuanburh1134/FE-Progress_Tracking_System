import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#070a12] text-gray-900 dark:text-white">

      {/* SIDEBAR */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* MAIN AREA */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out
        ${open ? "ml-64" : "ml-16"}`}
      >

        {/* HEADER */}
        <Header open={open} />

        {/* CONTENT */}
        <main className="flex-1 pt-16 p-6 overflow-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

