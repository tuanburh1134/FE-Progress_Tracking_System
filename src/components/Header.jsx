import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiBell,
  FiSettings,
  FiAlertCircle,
  FiClipboard,
  FiMail,
  FiCheck,
  FiX,
  FiUserX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { STORAGE_KEYS } from "../constants";

// ─── LocalStorage key helpers ────────────────────────────────────────────────
// Key để lưu thông báo hệ thống dành cho một user (người mời nhận thông báo từ chối, v.v.)
const getSysNotifsKey = (userId) => `sys_notifs_${userId}`;

export default function Header({ open }) {
  const navigate = useNavigate();

  const storeUser = useAuthStore((s) => s.user);
  const localUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEYS.USER_INFO) ||
        localStorage.getItem("user") ||
        "null"
      );
    } catch { return null; }
  })();
  const currentUser = storeUser || localUser;

  const name = currentUser?.fullName || currentUser?.username || "User";
  const firstLetter = name.charAt(0).toUpperCase();

  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);   // task overdue / assigned
  const [sysNotifs, setSysNotifs] = useState([]);            // system notifs (e.g. bị từ chối)
  const [invitations, setInvitations] = useState([]);        // lời mời chờ
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpenNotification, setIsOpenNotification] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const notificationRef = useRef(null);
  const avatarRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    useAuthStore.getState().clearAuth();
    navigate("/login");
  };

  // ── LocalStorage key: danh sách ID đã xem ─────────────────────────────────
  const getSeenIdsKey = (uid) => `notif_seen_${uid}`;

  // ── Lấy danh sách thông báo thực (không seed demo) ─────────────────────────
  const fetchAll = useCallback(() => {
    if (!currentUser) return;

    const userId = String(currentUser.id || currentUser.email || "anon");
    const sysKey = getSysNotifsKey(userId);
    const seenKey = getSeenIdsKey(userId);
    const seenIds = new Set(JSON.parse(localStorage.getItem(seenKey) || "[]"));

    // 1. Lời mời pending dành cho user hiện tại
    const allInvites = JSON.parse(localStorage.getItem("invitations") || "[]");
    const myInvites = allInvites.filter(
      (i) =>
        i.status === "pending" &&
        (i.inviteeEmail === currentUser.email ||
          String(i.inviteeId) === userId)
    );
    setInvitations(myInvites);

    // 2. Thông báo hệ thống
    const rawSys = JSON.parse(localStorage.getItem(sysKey) || "[]");
    setSysNotifs(rawSys);

    // 3. Task overdue / assigned
    const projects = JSON.parse(localStorage.getItem("projects") || "[]");
    const today = new Date().toISOString().split("T")[0];
    const taskNotifs = [];

    projects.forEach((proj) => {
      const projTasks = JSON.parse(localStorage.getItem("tasks_" + proj.id) || "[]");
      const allTasks = [...projTasks];
      if (proj.tasks && Array.isArray(proj.tasks)) {
        proj.tasks.forEach((t) => {
          if (!allTasks.some((x) => x.id === t.id)) allTasks.push(t);
        });
      }

      allTasks.forEach((task) => {
        if (task.deadline && task.status !== "done" && task.deadline <= today) {
          taskNotifs.push({
            id: `overdue-${proj.id}-${task.id}`,
            projectId: proj.id,
            projectName: proj.name,
            type: "overdue",
            title: "Trễ tiến độ",
            message: `Công việc "${task.name}" đã trễ hạn (${task.deadline}).`,
          });
        }

        const isAssigned =
          task.assignee &&
          (String(task.assignee.id) === userId ||
            task.assignee.email === currentUser.email ||
            task.assignee.name === currentUser.fullName ||
            task.assignee.name === currentUser.username);

        if (isAssigned && task.status !== "done") {
          taskNotifs.push({
            id: `assigned-${proj.id}-${task.id}`,
            projectId: proj.id,
            projectName: proj.name,
            type: "assigned",
            title: "Công việc được giao",
            message: `Bạn được giao "${task.name}" trong dự án "${proj.name}".`,
            createdAt: task.assignedAt || 0,
          });
        }
      });
    });

    setNotifications(taskNotifs);

    // 4. Tính badge: đếm các ID chưa có trong seenIds
    const unreadInvites = myInvites.filter((i) => !seenIds.has(i.id)).length;
    const unreadTasks   = taskNotifs.filter((n) => !seenIds.has(n.id)).length;
    const unreadSysN    = rawSys.filter((n) => !n.readAt).length;
    setUnreadCount(unreadInvites + unreadTasks + unreadSysN);
  }, [currentUser]);

  // Mount & storage events
  useEffect(() => {
    fetchAll();
    const handler = () => fetchAll();
    window.addEventListener("storage", handler);
    window.addEventListener("storage-update", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("storage-update", handler);
    };
  }, [fetchAll]);

  // Khi mở dropdown → lưu tất cả ID hiện tại vào seenIds → badge về 0
  useEffect(() => {
    if (isOpenNotification && currentUser) {
      const userId = String(currentUser.id || currentUser.email || "anon");
      const seenKey = getSeenIdsKey(userId);
      const now = Date.now();

      // Gom tất cả ID thông báo hiện tại
      const allCurrentIds = [
        ...invitations.map((i) => i.id),
        ...notifications.map((n) => n.id),
        ...sysNotifs.map((n) => n.id),
      ];
      const existingSeen = JSON.parse(localStorage.getItem(seenKey) || "[]");
      const merged = Array.from(new Set([...existingSeen, ...allCurrentIds]));
      localStorage.setItem(seenKey, JSON.stringify(merged));

      // Đánh dấu sys notifs là đã đọc
      const sysKey = getSysNotifsKey(userId);
      const rawSys = JSON.parse(localStorage.getItem(sysKey) || "[]");
      const markedSys = rawSys.map((n) => n.readAt ? n : { ...n, readAt: now });
      localStorage.setItem(sysKey, JSON.stringify(markedSys));
      setSysNotifs(markedSys);

      // Reset badge
      setUnreadCount(0);
    }
  }, [isOpenNotification]);

  // Click outside để đóng dropdown
  useEffect(() => {
    const onOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setIsOpenNotification(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setMenu(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // ── Đồng ý lời mời → vào nhóm ──────────────────────────────────────────────
  const handleAccept = (invite) => {
    try {
      // Thêm dự án vào danh sách
      const projects = JSON.parse(localStorage.getItem("projects") || "[]");
      if (!projects.some((p) => String(p.id) === String(invite.projectData.id))) {
        projects.unshift({ ...invite.projectData });
        localStorage.setItem("projects", JSON.stringify(projects));

        // Khởi tạo columns Kanban
        const initCols = [
          { id: "todo",   name: "Chờ xử lý" },
          { id: "doing",  name: "Đang thực hiện" },
          { id: "review", name: "Đang xem xét" },
          { id: "done",   name: "Hoàn thành" },
        ];
        localStorage.setItem("columns_" + invite.projectData.id, JSON.stringify(initCols));
        localStorage.setItem("tasks_" + invite.projectData.id, JSON.stringify([]));
      }

      // Cập nhật trạng thái lời mời
      const allInvites = JSON.parse(localStorage.getItem("invitations") || "[]");
      const updated = allInvites.map((i) =>
        i.id === invite.id ? { ...i, status: "accepted" } : i
      );
      localStorage.setItem("invitations", JSON.stringify(updated));

      // Gửi thông báo cho người mời biết đã chấp nhận
      if (invite.inviterId) {
        const inviterSysKey = getSysNotifsKey(String(invite.inviterId));
        const inviterNotifs = JSON.parse(localStorage.getItem(inviterSysKey) || "[]");
        inviterNotifs.unshift({
          id: `accepted-${invite.id}-${Date.now()}`,
          type: "invite_accepted",
          title: "Lời mời được chấp nhận",
          message: `${name} đã đồng ý tham gia dự án "${invite.projectName}".`,
          createdAt: Date.now(),
        });
        localStorage.setItem(inviterSysKey, JSON.stringify(inviterNotifs));
      }

      fetchAll();
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("storage-update"));
    } catch (e) {
      console.error("Lỗi chấp nhận lời mời:", e);
    }
  };

  // ── Từ chối lời mời → thông báo ngược lại cho người mời ───────────────────
  const handleDecline = (invite) => {
    try {
      const allInvites = JSON.parse(localStorage.getItem("invitations") || "[]");
      const updated = allInvites.map((i) =>
        i.id === invite.id ? { ...i, status: "declined" } : i
      );
      localStorage.setItem("invitations", JSON.stringify(updated));

      // Gửi thông báo cho người mời biết đã từ chối
      if (invite.inviterId) {
        const inviterSysKey = getSysNotifsKey(String(invite.inviterId));
        const inviterNotifs = JSON.parse(localStorage.getItem(inviterSysKey) || "[]");
        inviterNotifs.unshift({
          id: `declined-${invite.id}-${Date.now()}`,
          type: "invite_declined",
          title: "Lời mời bị từ chối",
          message: `${name} đã từ chối tham gia dự án "${invite.projectName}".`,
          createdAt: Date.now(),
        });
        localStorage.setItem(inviterSysKey, JSON.stringify(inviterNotifs));
      }

      fetchAll();
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("storage-update"));
    } catch (e) {
      console.error("Lỗi từ chối lời mời:", e);
    }
  };

  // ── Xoá một sys notif ───────────────────────────────────────────────────────
  const dismissSysNotif = (notifId) => {
    if (!currentUser) return;
    const userId = String(currentUser.id || currentUser.email || "anon");
    const sysKey = getSysNotifsKey(userId);
    const rawSys = JSON.parse(localStorage.getItem(sysKey) || "[]");
    const filtered = rawSys.filter((n) => n.id !== notifId);
    localStorage.setItem(sysKey, JSON.stringify(filtered));
    setSysNotifs(filtered);
  };

  // ── Tổng hiển thị ─────────────────────────────────────────────────────────
  const totalAll = invitations.length + notifications.length + sysNotifs.length;
  const activeTasks = notifications.length;
  const activeSys = sysNotifs.length;

  return (
    <div
      className="
        fixed top-0 right-0 h-14 bg-[#0b0f1a]
        border-b border-gray-800 flex items-center justify-between
        px-4 z-30
      "
      style={{
        marginLeft: open ? "16rem" : "4rem",
        width: open ? "calc(100% - 16rem)" : "calc(100% - 4rem)",
        transition: "all 300ms ease",
      }}
    >
      {/* LEFT */}
      <div className="text-white font-bold text-lg">
        {!open ? "ProjectHub" : ""}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* ── HÒM THƯ ─────────────────────────────────────────────── */}
        <div className="relative" ref={notificationRef}>
          <button
            id="btn-inbox"
            onClick={() => setIsOpenNotification((v) => !v)}
            className="text-gray-300 hover:text-white text-xl relative p-1 transition duration-200"
          >
            <FiBell />
            {unreadCount > 0 && (
              <span className="
                absolute -top-1 -right-1 bg-red-500 text-[10px] text-white
                font-bold rounded-full min-w-[18px] h-[18px] flex items-center
                justify-center animate-pulse border-2 border-[#0b0f1a] px-0.5
              ">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* ── DROPDOWN ─────────────────────────────────────────── */}
          {isOpenNotification && (
            <div
              className="
                absolute right-0 mt-3 w-[360px] bg-[#0f1422] border border-gray-800
                rounded-xl shadow-2xl z-50 overflow-hidden
                animate-[fadeIn_.15s_ease]
              "
              style={{ animation: "slideDown .15s ease" }}
            >
              {/* Header */}
              <div className="px-4 py-3 bg-[#121829] border-b border-gray-800 flex items-center justify-between">
                <span className="font-bold text-white text-sm">Hòm thư</span>
                <span className="text-[11px] text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded-full">
                  {totalAll === 0 ? "Không có gì mới" : `${totalAll} thông báo`}
                </span>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-800 bg-[#0e1220]">
                {[
                  { key: "all",         label: "Tất cả",                 count: totalAll },
                  { key: "tasks",       label: "Công việc",              count: activeTasks },
                  { key: "invitations", label: "Lời mời",                count: invitations.length },
                  { key: "system",      label: "Hệ thống",               count: activeSys },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2 text-[11px] font-semibold border-b-2 transition flex items-center justify-center gap-1 ${
                      activeTab === tab.key
                        ? "border-blue-500 text-white"
                        : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="bg-gray-700 text-gray-300 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-800/60 bg-[#0f1422]">

                {/* ── LỊCH MỜI (pending) ── */}
                {(activeTab === "all" || activeTab === "invitations") && invitations.map((inv) => (
                  <div key={inv.id} className="p-4 bg-violet-950/10 hover:bg-violet-950/20 transition-colors">
                    <div className="flex gap-3">
                      <div className="mt-0.5 text-purple-400 text-base flex-shrink-0">
                        <FiMail />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                          Lời mời vào nhóm
                        </p>
                        <p className="text-white text-xs mt-1 leading-relaxed">
                          <span className="font-semibold text-blue-400">{inv.inviterName}</span>
                          {" "}mời bạn vào{" "}
                          <span className="font-semibold">"{inv.projectName}"</span>
                          {" "}với vai trò{" "}
                          <span className="bg-purple-600/20 text-purple-300 px-1.5 py-0.5 rounded text-[10px]">
                            {inv.role || "Thành viên"}
                          </span>
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleAccept(inv)}
                            className="bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                          >
                            <FiCheck className="text-xs" /> Đồng ý
                          </button>
                          <button
                            onClick={() => handleDecline(inv)}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                          >
                            <FiX className="text-xs" /> Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* ── CÔNG VIỆC / CẢNH BÁO ── */}
                {(activeTab === "all" || activeTab === "tasks") && notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setIsOpenNotification(false);
                      navigate(`/project/${item.projectId}`);
                    }}
                    className="p-4 hover:bg-gray-800/40 transition cursor-pointer flex gap-3"
                  >
                    <div className={`mt-0.5 text-base flex-shrink-0 ${
                      item.type === "overdue" ? "text-red-500" : "text-blue-500"
                    }`}>
                      {item.type === "overdue" ? <FiAlertCircle /> : <FiClipboard />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${
                        item.type === "overdue" ? "text-red-400" : "text-blue-400"
                      }`}>
                        {item.title}
                      </p>
                      <p className="text-gray-300 text-xs mt-1 leading-relaxed">{item.message}</p>
                      <p className="text-[10px] text-gray-600 mt-1">Dự án: {item.projectName}</p>
                    </div>
                  </div>
                ))}

                {/* ── THÔNG BÁO HỆ THỐNG (ví dụ: bị từ chối) ── */}
                {(activeTab === "all" || activeTab === "system") && sysNotifs.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 flex gap-3 transition-colors ${
                      notif.readAt ? "opacity-60" : "bg-amber-950/10 hover:bg-amber-950/20"
                    }`}
                  >
                    <div className={`mt-0.5 text-base flex-shrink-0 ${
                      notif.type === "invite_declined" ? "text-orange-400" : "text-green-400"
                    }`}>
                      {notif.type === "invite_declined" ? <FiUserX /> : <FiCheck />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${
                        notif.type === "invite_declined" ? "text-orange-400" : "text-green-400"
                      }`}>
                        {notif.title}
                      </p>
                      <p className="text-gray-300 text-xs mt-1 leading-relaxed">{notif.message}</p>
                      {notif.readAt && (
                        <p className="text-[9px] text-gray-600 mt-1">Đã đọc</p>
                      )}
                    </div>
                    <button
                      onClick={() => dismissSysNotif(notif.id)}
                      className="text-gray-700 hover:text-gray-400 flex-shrink-0 self-start mt-0.5 transition"
                      title="Xoá thông báo này"
                    >
                      <FiX className="text-xs" />
                    </button>
                  </div>
                ))}

                {/* ── EMPTY STATE ── */}
                {((activeTab === "all" && totalAll === 0) ||
                  (activeTab === "tasks" && activeTasks === 0) ||
                  (activeTab === "invitations" && invitations.length === 0) ||
                  (activeTab === "system" && activeSys === 0)) && (
                  <div className="py-10 flex flex-col items-center justify-center gap-2 text-gray-600">
                    <FiBell className="text-3xl text-gray-700" />
                    <p className="text-xs">Không có thông báo nào</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          className="text-gray-300 hover:text-white text-xl"
        >
          <FiSettings />
        </button>

        {/* Avatar */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setMenu((v) => !v)}
            className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold"
          >
            {firstLetter}
          </button>

          {menu && (
            <div className="absolute right-0 mt-2 w-36 bg-[#111] border border-gray-700 rounded-lg shadow-xl text-sm z-50 overflow-hidden">
              <button
                onClick={() => { setMenu(false); navigate("/profile"); }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-800 transition"
              >
                Hồ Sơ
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 hover:bg-red-600 transition text-gray-300 hover:text-white"
              >
                Đăng Xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}