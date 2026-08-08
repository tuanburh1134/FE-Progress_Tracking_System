import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  // desktop: sidebar open/collapse
  const [open, setOpen] = useState(true);
  // mobile: drawer open/close
  const [mobileOpen, setMobileOpen] = useState(false);
  // track window width for responsive margin
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setWindowWidth(w);
      // Đóng mobile drawer khi resize lên desktop
      if (w >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDesktop = windowWidth >= 1024;

  // Tính margin-left cho main content
  const mainMarginLeft = isDesktop
    ? open ? "16rem" : "4rem"
    : "0px";

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#070a12] text-gray-900 dark:text-white">

      {/* MOBILE OVERLAY — hiện khi drawer mở */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <Sidebar
        open={open}
        setOpen={setOpen}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* MAIN AREA */}
      <div
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
        style={{ marginLeft: mainMarginLeft }}
      >
        {/* HEADER */}
        <Header open={open} onMobileMenuToggle={() => setMobileOpen((v) => !v)} />

        {/* CONTENT */}
        <main className="flex-1 pt-16 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
