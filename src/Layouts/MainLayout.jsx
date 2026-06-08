import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex">

      {/* SIDEBAR */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* CONTENT */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out p-6
        ${open ? "ml-64" : "ml-16"}`}
      >
        <Outlet />
      </div>

    </div>
  );
}