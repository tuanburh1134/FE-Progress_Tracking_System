import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// ── Xóa dữ liệu demo lời mời cũ (migrate v1 → v2) ──────────────────────────
(function removeLegacyDemoInvitations() {
  try {
    const DEMO_IDS = ["invite-1", "invite-2"];
    const raw = localStorage.getItem("invitations");
    if (!raw) return;
    const all = JSON.parse(raw);
    // Nếu toàn bộ là demo → xóa hẳn; ngược lại lọc bỏ demo
    const cleaned = all.filter((i) => !DEMO_IDS.includes(i.id));
    if (cleaned.length !== all.length) {
      if (cleaned.length === 0) localStorage.removeItem("invitations");
      else localStorage.setItem("invitations", JSON.stringify(cleaned));
    }
  } catch { /* ignore */ }
})();

// ── Load theme từ localStorage khi app start ──────────────────────────────
(function loadTheme() {
  const theme = localStorage.getItem("theme") || "dark";
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

