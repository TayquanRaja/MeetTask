// import { useEffect, useState } from 'react'
// import { NavLink, Outlet, useLocation } from 'react-router-dom'
// import { Bell, CalendarDays, LayoutDashboard, ListChecks, LogOut, Menu, ScrollText, User, Users, X } from 'lucide-react'
// import { api } from '../api'
// import { useAuth } from '../auth'
// import { Avatar, Badge } from './ui'
// import { Logo } from './Logo'

// const WORK = [
//   ['/', 'Dashboard', LayoutDashboard],
//   ['/meetings', 'Meetings', CalendarDays],
//   ['/tasks', 'Tasks', ListChecks],
//   ['/notifications', 'Notifications', Bell],
//   ['/profile', 'Profile', User],
// ]
// const NAV = {
//   ADMIN: [
//     ['/', 'Dashboard', LayoutDashboard],
//     ['/users', 'Users', Users],
//     ['/audit', 'Audit logs', ScrollText],
//     ['/notifications', 'Notifications', Bell],
//     ['/profile', 'Profile', User],
//   ],
//   MANAGER: WORK,
//   EMPLOYEE: WORK,
// }

// export default function Layout() {
//   const { user, logout } = useAuth()
//   const [open, setOpen] = useState(false)
//   const [unread, setUnread] = useState(0)
//   const loc = useLocation()

//   useEffect(() => {
//     const load = () =>
//       api
//         .get('/notifications/')
//         .then((r) => setUnread(r.data.results.filter((n) => !n.is_read).length))
//         .catch(() => {})
//     load()
//     window.addEventListener('mt:notifications', load)
//     return () => window.removeEventListener('mt:notifications', load)
//   }, [loc.pathname])

//   return (
//     <div className="min-h-screen">
//       <aside
//         className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 text-white transition-transform lg:translate-x-0 ${
//           open ? 'translate-x-0' : '-translate-x-full'
//         }`}
//       >
//         <div className="flex items-center justify-between px-5 py-6">
//           <Logo dark size={36} tagline={false} />
//           <button className="text-slate-400 lg:hidden" onClick={() => setOpen(false)}>
//             <X size={20} />
//           </button>
//         </div>
//         <p className="px-6 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Workspace</p>
//         <nav className="flex-1 space-y-1 px-3">
//           {NAV[user.role].map(([to, label, Icon]) => (
//             <NavLink
//               key={to}
//               to={to}
//               end={to === '/'}
//               onClick={() => setOpen(false)}
//               className={({ isActive }) =>
//                 `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
//                   isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
//                 }`
//               }
//             >
//               <Icon size={18} />
//               <span className="flex-1">{label}</span>
//               {label === 'Notifications' && unread > 0 && (
//                 <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold">{unread}</span>
//               )}
//             </NavLink>
//           ))}
//         </nav>
//         <div className="m-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
//           <Avatar name={user.name} />
//           <div className="min-w-0 flex-1">
//             <div className="truncate text-sm font-medium">{user.name}</div>
//             <div className="truncate text-xs capitalize text-slate-400">{user.role.toLowerCase()}</div>
//           </div>
//           <button onClick={logout} title="Log out" className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white">
//             <LogOut size={16} />
//           </button>
//         </div>
//       </aside>

//       {open && <div className="fixed inset-0 z-30 bg-navy-950/50 lg:hidden" onClick={() => setOpen(false)} />}

//       <div className="lg:pl-64">
//         <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6">
//           <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)}>
//             <Menu size={20} />
//           </button>
//           <div className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400 lg:block">
//             {user.role} workspace
//           </div>
//           <div className="flex items-center gap-3">
//             <NavLink to="/notifications" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
//               <Bell size={20} />
//               {unread > 0 && (
//                 <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
//                   {unread}
//                 </span>
//               )}
//             </NavLink>
//             <Badge value={user.role} />
//             <NavLink to="/profile" title="Profile">
//               <Avatar name={user.name} size={34} />
//             </NavLink>
//           </div>
//         </header>
//         <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   )
// }

import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CalendarRange,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Users,
  X,
  ShieldCheck,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Avatar, Badge } from "./ui";
import { Logo } from "./Logo";

const NAV = {
  ADMIN: [
    ["/", "Dashboard", LayoutDashboard],
    ["/users", "Users", Users],
    ["/audit", "Audit logs", ScrollText],
  ],
  MANAGER: [
    ["/", "Dashboard", LayoutDashboard],
    ["/meetings", "Meetings", CalendarDays],
    ["/projects", "Projects", FolderKanban],
    ["/tasks", "Tasks", ListChecks],
    ["/planner", "Planner", CalendarRange],
    ["/analytics", "Analytics", BarChart3],
  ],
  EMPLOYEE: [
    ["/", "Dashboard", LayoutDashboard],
    ["/meetings", "Meetings", CalendarDays],
    ["/tasks", "Tasks", ListChecks],
    ["/planner", "Planner", CalendarRange],
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);
  const loc = useLocation();

  useEffect(() => {
    const load = () =>
      api
        .get("/notifications/")
        .then((r) => setUnread(r.data.results.filter((n) => !n.is_read).length))
        .catch(() => {});
    load();
    window.addEventListener("mt:notifications", load);
    return () => window.removeEventListener("mt:notifications", load);
  }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col justify-between">
      {/* Desktop & Mobile Interactive Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-navy-900 text-white transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 shadow-2xl`}
      >
        <div
          className={`flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-5"} py-6 border-b border-white/10`}
        >
          {!collapsed && <Logo dark size={34} tagline={false} />}
          {collapsed && (
            <span className="font-bold text-lg text-white tracking-wider">
              MT
            </span>
          )}
          <button
            className="text-slate-400 lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {!collapsed && (
          <div className="flex items-center justify-between px-6 pt-4 pb-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
              Workspace
            </span>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center pt-3 pb-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white transition p-2 rounded-lg hover:bg-white/5"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          {NAV[user.role].map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3.5 text-[15px] font-medium transition-all ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm font-semibold"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                } ${collapsed ? "justify-center px-0" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Left Active Accent Indicator Pill */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-sky-400 shadow-sm shadow-sky-400/50" />
                  )}
                  <Icon
                    size={22}
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-sky-400" : "text-slate-400"}`}
                  />

                  {!collapsed && (
                    <span className="flex-1 truncate">{label}</span>
                  )}

                  {/* Collapsed Hover Tooltip */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 border border-white/10">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Capsule Footer in Sidebar */}
        <div
          className={`m-3 flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5 transition-all ${collapsed ? "justify-center px-2" : ""}`}
        >
          <Avatar name={user.name} size={36} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="truncate text-xs capitalize text-slate-400">
                {user.role.toLowerCase()}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              title="Log out"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main content wrapper */}
      <div
        className={`flex-1 transition-all duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}
      >
        {/* Elite Frosted Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 sm:px-10 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <button
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100/80 lg:hidden transition"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                {user.role} Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NavLink
              to="/notifications"
              className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 transition"
              title="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                  {unread}
                </span>
              )}
            </NavLink>
            <div className="h-5 w-px bg-slate-200" />
            <Badge value={user.role} />
            <NavLink
              to="/profile"
              title="Profile view"
              className="ring-2 ring-slate-200/80 rounded-full hover:ring-brand transition shadow-sm"
            >
              <Avatar name={user.name} size={36} />
            </NavLink>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] space-y-6 p-6 sm:p-10 min-h-[calc(100vh-140px)]">
          <Outlet />
        </main>
        {/* Professional Corporate Footer */}
        <footer className="border-t border-slate-200/80 bg-white px-6 sm:px-10 py-6 text-xs text-slate-400">
          <div className="mx-auto w-full max-w-[1600px] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700 tracking-tight">
                MeetTask AI
              </span>
              <span className="text-slate-300">·</span>
              <span>Secure Office Intelligence & Task Automation</span>
            </div>
            <div className="flex items-center gap-5 font-medium">
              <span className="flex items-center gap-1.5 text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600" /> SOC2
                Compliant Pipeline
              </span>
              <span className="text-slate-300">·</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
