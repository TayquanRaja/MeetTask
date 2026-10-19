// import { useEffect, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { Search } from 'lucide-react'
// import { api, errMsg } from '../api'
// import { useAuth } from '../auth'
// import { Badge, Empty, ErrorBox, Loading, PageHeader, Pager, TABLE, TH, inputCls } from '../components/ui'
// import { fmtDay } from '../utils'

// const STATUS = [['PENDING', 'Pending'], ['IN_PROGRESS', 'In progress'], ['DONE', 'Done']]
// const SORTS = [['deadline', 'Deadline (soonest)'], ['-deadline', 'Deadline (latest)'], ['-created_at', 'Newest'], ['created_at', 'Oldest']]

// export default function Tasks() {
//   const { user } = useAuth()
//   const isMgr = user.role === 'MANAGER'
//   const [data, setData] = useState(null)
//   const [q, setQ] = useState('')
//   const [status, setStatus] = useState('')
//   const [priority, setPriority] = useState('')
//   const [overdue, setOverdue] = useState(false)
//   const [ordering, setOrdering] = useState('deadline')
//   const [page, setPage] = useState(1)
//   const [err, setErr] = useState('')

//   useEffect(() => {
//     setData(null)
//     setErr('')
//     const t = setTimeout(() => {
//       api
//         .get('/tasks/', {
//           params: {
//             q: q || undefined,
//             status: status || undefined,
//             priority: priority || undefined,
//             overdue: overdue ? 1 : undefined,
//             ordering,
//             page,
//           },
//         })
//         .then((r) => setData(r.data))
//         .catch((e) => setErr(errMsg(e)))
//     }, 250)
//     return () => clearTimeout(t)
//   }, [q, status, priority, overdue, ordering, page])

//   const reset = (fn) => (v) => { fn(v); setPage(1) }

//   const changeStatus = async (t, value) => {
//     setErr('')
//     try {
//       const { data: upd } = await api.patch(`/tasks/${t.id}/`, { status: value })
//       setData((d) => ({ ...d, results: d.results.map((x) => (x.id === t.id ? upd : x)) }))
//     } catch (e) {
//       setErr(errMsg(e))
//     }
//   }

//   return (
//     <>
//       <PageHeader title="Tasks" subtitle={isMgr ? 'Tasks created from your approved meetings.' : 'Tasks assigned to you.'} />

//       <div className="flex flex-wrap items-center gap-3">
//         <div className="relative w-full sm:w-64">
//           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//           <input className={`${inputCls} pl-9`} placeholder="Search tasks" value={q} onChange={(e) => reset(setQ)(e.target.value)} />
//         </div>
//         <select className={`${inputCls} w-auto`} value={status} onChange={(e) => reset(setStatus)(e.target.value)}>
//           <option value="">All statuses</option>
//           {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
//         </select>
//         <select className={`${inputCls} w-auto`} value={priority} onChange={(e) => reset(setPriority)(e.target.value)}>
//           <option value="">All priorities</option>
//           {['HIGH', 'MEDIUM', 'LOW'].map((p) => <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>)}
//         </select>
//         <select className={`${inputCls} w-auto`} value={ordering} onChange={(e) => reset(setOrdering)(e.target.value)}>
//           {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
//         </select>
//         <label className="flex items-center gap-2 text-sm text-slate-600">
//           <input type="checkbox" checked={overdue} onChange={(e) => reset(setOverdue)(e.target.checked)} />
//           Overdue only
//         </label>
//       </div>

//       <ErrorBox msg={err} />
//       {!data && !err && <Loading />}
//       {data && data.results.length === 0 && (
//         <Empty text="No tasks found. Tasks appear here after a manager approves a meeting's action items." />
//       )}
//       {data && data.results.length > 0 && (
//         <div className={TABLE}>
//           <table className="w-full text-sm">
//             <thead className="border-b border-slate-100 bg-slate-50">
//               <tr>
//                 <th className={TH}>Task</th>
//                 <th className={TH}>Meeting</th>
//                 {isMgr && <th className={TH}>Assignee</th>}
//                 <th className={TH}>Deadline</th>
//                 <th className={TH}>Priority</th>
//                 <th className={TH}>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {data.results.map((t) => (
//                 <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/60">
//                   <td className="px-4 py-3">
//                     <Link to={`/tasks/${t.id}`} className="font-medium text-brand hover:underline">{t.title}</Link>
//                   </td>
//                   <td className="px-4 py-3 text-slate-500">{t.meeting_title}</td>
//                   {isMgr && <td className="px-4 py-3">{t.assignee_name}</td>}
//                   <td className="whitespace-nowrap px-4 py-3">
//                     <span className={t.is_overdue ? 'font-medium text-red-600' : ''}>{fmtDay(t.deadline)}</span>
//                     {t.is_overdue && <span className="ml-2"><Badge value="OVERDUE" /></span>}
//                   </td>
//                   <td className="px-4 py-3"><Badge value={t.priority} /></td>
//                   <td className="px-4 py-3">
//                     <select
//                       value={t.status}
//                       onChange={(e) => changeStatus(t, e.target.value)}
//                       className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:border-brand focus:outline-none"
//                     >
//                       {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
//                     </select>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//       <Pager data={data} page={page} setPage={setPage} noun="tasks" />
//     </>
//   )
// }

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  LayoutGrid,
  List,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CircleDashed,
  ArrowUpDown,
  ArrowRight,
  SlidersHorizontal,
  X,
  RotateCcw,
  Users,
  AlertTriangle,
  ClipboardList,
  ChevronDown,
  Check,
  ListFilter,
} from "lucide-react";

import { api, errMsg } from "../api";
import { useAuth } from "../auth";
import {
  Badge,
  Empty,
  ErrorBox,
  Loading,
  Pager,
  TABLE,
  TH,
  inputCls,
} from "../components/ui";
import { fmtDay } from "../utils";

const STATUS = [
  ["PENDING", "Pending"],
  ["IN_PROGRESS", "In progress"],
  ["DONE", "Done"],
];

const FILTER_STATUS = [
  ["PENDING", "Pending"],
  ["IN_PROGRESS", "In progress"],
  ["IN_REVIEW", "In review"],
  ["DONE", "Done"],
];

// Employees cannot mark a proof-required task Done themselves; they submit proof instead.
const moveOptions = (task) =>
  STATUS.filter(([value]) => !(value === "DONE" && task.proof_required));

const SORTS = [
  ["deadline", "Deadline: soonest"],
  ["-deadline", "Deadline: latest"],
  ["-created_at", "Newest first"],
  ["created_at", "Oldest first"],
];

const STATUS_META = {
  PENDING: {
    label: "Pending",
    icon: CircleDashed,
    color: "text-slate-600",
    iconBg: "bg-slate-100",
    dot: "bg-slate-400",
    border: "border-t-slate-400",
  },
  IN_PROGRESS: {
    label: "In progress",
    icon: Clock3,
    color: "text-blue-700",
    iconBg: "bg-blue-50",
    dot: "bg-blue-500",
    border: "border-t-blue-500",
  },
  IN_REVIEW: {
    label: "In review",
    icon: ShieldCheck,
    color: "text-amber-700",
    iconBg: "bg-amber-50",
    dot: "bg-amber-500",
    border: "border-t-amber-500",
  },
  DONE: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-700",
    iconBg: "bg-emerald-50",
    dot: "bg-emerald-500",
    border: "border-t-emerald-500",
  },
};

function getStatus(task) {
  if (task.is_overdue && task.status !== "DONE" && task.status !== "IN_REVIEW")
    return "OVERDUE";
  return task.status;
}

function getPriority(task) {
  const value = String(task.priority || "").toUpperCase();

  if (value === "HIGH") {
    return {
      label: "High priority",
      className: "bg-red-50 text-red-700 ring-red-600/15",
      dot: "bg-red-500",
    };
  }

  if (value === "MEDIUM") {
    return {
      label: "Medium priority",
      className: "bg-amber-50 text-amber-800 ring-amber-600/15",
      dot: "bg-amber-500",
    };
  }

  if (value === "LOW") {
    return {
      label: "Low priority",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
      dot: "bg-emerald-500",
    };
  }

  return {
    label: task.priority || "Unspecified",
    className: "bg-slate-100 text-slate-600 ring-slate-500/10",
    dot: "bg-slate-400",
  };
}

function PriorityBadge({ task }) {
  const priority = getPriority(task);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${priority.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
      {priority.label}
    </span>
  );
}

function TaskStatus({ task }) {
  const status = getStatus(task);

  if (status === "OVERDUE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-600/15">
        <AlertTriangle size={12} />
        Overdue
      </span>
    );
  }

  const meta = STATUS_META[status] || STATUS_META.PENDING;
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.iconBg} ${meta.color}`}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:p-5 ${
        active
          ? "border-brand ring-1 ring-brand/20"
          : "border-slate-200/80 hover:border-brand/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
        </div>

        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}
        >
          <Icon size={20} />
        </span>
      </div>

      <p className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500">
        {subtitle}
        <ArrowRight
          size={13}
          className="transition-transform group-hover:translate-x-1"
        />
      </p>

      {active && (
        <span className="absolute bottom-0 left-0 h-0.5 w-full bg-brand" />
      )}
    </button>
  );
}

function TaskCard({
  task,
  isMgr,
  busy,
  onStatusChange,
  onDragStart,
  onDragEnd,
  isDragging,
}) {
  const priority = getPriority(task);

  return (
    <article
      draggable={!isMgr && !busy && task.status !== "IN_REVIEW"}
      onDragStart={(e) => {
        if (isMgr || busy || task.status === "IN_REVIEW") {
          e.preventDefault();
          return;
        }

        e.dataTransfer.setData("text/plain", String(task.id));
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(task.id);
        const card = e.currentTarget;
        const preview = card.cloneNode(true);
        const width = card.getBoundingClientRect().width;

        preview.style.width = `${width}px`;
        preview.style.position = "absolute";
        preview.style.top = "-1000px";
        preview.style.left = "-1000px";
        preview.style.opacity = "1";
        preview.style.transform = "rotate(2deg) scale(1.03)";
        preview.style.boxShadow = "0 18px 45px rgba(15, 23, 42, 0.22)";
        preview.style.border = "1px solid #93c5fd";
        preview.style.borderRadius = "12px";
        preview.style.pointerEvents = "none";

        document.body.appendChild(preview);

        e.dataTransfer.setDragImage(preview, Math.min(40, width / 3), 20);

        requestAnimationFrame(() => preview.remove());
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-brand/30 hover:shadow-md ${
        !isMgr && !busy && task.status !== "IN_REVIEW"
          ? "cursor-grab active:cursor-grabbing"
          : ""
      } ${
        isDragging
          ? "opacity-100 scale-[1.03] -rotate-1 border-brand shadow-2xl ring-2 ring-brand/20 z-20"
          : "opacity-100 scale-100 rotate-0 shadow-sm"
      } `}
    >
      <div className="flex items-start justify-between gap-2">
        <PriorityBadge task={task} />

        <Link
          to={`/tasks/${task.id}`}
          aria-label={`Open task ${task.title}`}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ArrowRight size={16} />
        </Link>
      </div>

      <Link
        to={`/tasks/${task.id}`}
        className="mt-3 block text-sm font-semibold leading-5 text-slate-900 transition-colors hover:text-brand"
      >
        {task.title}
      </Link>

      <div className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
        <ClipboardList size={14} className="mt-0.5 shrink-0" />
        <span className="line-clamp-2">
          {task.project_name ||
            task.meeting_title ||
            "Not grouped to a project"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays size={14} className="shrink-0 text-slate-400" />
          <span
            className={`truncate text-xs font-medium ${
              getStatus(task) === "OVERDUE" ? "text-red-600" : "text-slate-600"
            }`}
          >
            {task.deadline ? fmtDay(task.deadline) : "No deadline"}
          </span>
        </div>

        <TaskStatus task={task} />
      </div>

      {isMgr && task.status === "IN_REVIEW" && (
        <Link
          to={`/tasks/${task.id}`}
          className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600"
        >
          <ShieldCheck size={14} /> Review proof
        </Link>
      )}

      {isMgr ? (
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">
            {(task.assignee_name || "?").slice(0, 1).toUpperCase()}
          </span>

          <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">
            {task.assignee_name || "Unassigned"}
          </span>
        </div>
      ) : (
        <div className="mt-3 border-t border-slate-100 pt-3">
          {task.status === "IN_REVIEW" ? (
            <Link
              to={`/tasks/${task.id}`}
              className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              <ShieldCheck size={14} /> Waiting for manager review
            </Link>
          ) : (
            <>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Update my progress
              </label>

              <select
                aria-label={`Update progress for ${task.title}`}
                disabled={busy}
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand disabled:opacity-50"
              >
                {moveOptions(task).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {task.proof_required && (
                <Link
                  to={`/tasks/${task.id}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                >
                  <ShieldCheck size={13} /> Submit proof to finish
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}

function KanbanColumn({
  status,
  tasks,
  isMgr,
  busyId,
  onStatusChange,
  onDropTask,
  onDragStart,
  onDragEnd,
  draggingId,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <section
      onDragEnter={(e) => {
        if (isMgr) return;
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragOver={(e) => {
        if (isMgr) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (isMgr) return;

        const id = e.dataTransfer.getData("text/plain");
        if (id) onDropTask(id, status);
      }}
      className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200 border-t-[3px] ${meta.border} transition-all duration-200 ease-out ${
        isDragOver && !isMgr
          ? "border-brand bg-brand/10 ring-2 ring-brand/20 scale-[1.01]"
          : "bg-slate-50/70"
      }`}
    >
      {isDragOver && (
        <div className="mb-3 rounded-xl border-2 border-dashed border-brand bg-brand/10 px-4 py-5 text-center text-sm font-medium text-brand">
          Drop task here
        </div>
      )}
      <div className="flex items-center justify-between gap-2 px-3 py-4 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${meta.iconBg} ${meta.color}`}
          >
            <Icon size={17} />
          </span>
          <h2 className="truncate text-sm font-bold text-slate-800">
            {meta.label}
          </h2>
        </div>

        <span className="grid h-7 min-w-7 place-items-center rounded-full border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3 px-3 pb-3 sm:px-4 sm:pb-4">
        {tasks.length ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isMgr={isMgr}
              busy={busyId === task.id}
              onStatusChange={onStatusChange}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggingId === task.id}
            />
          ))
        ) : (
          <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 py-5 text-center">
            <CheckCircle2 size={21} className="text-slate-300" />
            <p className="mt-2 text-xs font-medium text-slate-500">
              Nothing here right now
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Tasks() {
  const [draggingId, setDraggingId] = useState(null);
  const { user } = useAuth();
  const isMgr = user.role === "MANAGER";

  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [params] = useSearchParams();
  const [status, setStatus] = useState(() => {
    const v = params.get("status");
    return FILTER_STATUS.some(([value]) => value === v) ? v : "";
  });
  const [priority, setPriority] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [ordering, setOrdering] = useState("deadline");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("board");
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [project, setProject] = useState("");
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (!isMgr) return;
    api
      .get("/projects/", { params: { status: "ACTIVE" } })
      .then((r) => setProjects(r.data))
      .catch(() => {});
  }, [isMgr]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setData(null);
    setErr("");

    const timer = setTimeout(() => {
      api
        .get("/tasks/", {
          signal: controller.signal,
          params: {
            q: q || undefined,
            status: status || undefined,
            priority: priority || undefined,
            overdue: overdue ? 1 : undefined,
            project: project || undefined,
            ordering,
            page,
          },
        })
        .then((response) => {
          if (!cancelled) setData(response.data);
        })
        .catch((error) => {
          if (
            !cancelled &&
            error.name !== "CanceledError" &&
            error.code !== "ERR_CANCELED"
          ) {
            setErr(errMsg(error));
          }
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, status, priority, overdue, project, ordering, page]);

  const tasks = data?.results || [];

  const stats = useMemo(() => {
    return tasks.reduce(
      (result, task) => {
        result.total += 1;

        if (task.status === "PENDING") result.pending += 1;
        if (task.status === "IN_PROGRESS") result.progress += 1;
        if (task.status === "IN_REVIEW") result.review += 1;
        if (task.status === "DONE") result.done += 1;
        if (
          task.is_overdue &&
          task.status !== "DONE" &&
          task.status !== "IN_REVIEW"
        )
          result.overdue += 1;

        return result;
      },
      { total: 0, pending: 0, progress: 0, review: 0, done: 0, overdue: 0 },
    );
  }, [tasks]);

  const dropTask = async (taskId, targetStatus) => {
    if (isMgr || busyId !== null) return;

    const task = tasks.find((item) => String(item.id) === String(taskId));

    if (!task || task.status === targetStatus) {
      setDraggingId(null);
      return;
    }

    if (task.status === "IN_REVIEW" || targetStatus === "IN_REVIEW") {
      setErr(
        "Tasks move to In review when proof is submitted, and leave it when your manager decides.",
      );
      setDraggingId(null);
      return;
    }

    if (targetStatus === "DONE" && task.proof_required) {
      setErr("This task needs proof. Open it and submit proof for review.");
      setDraggingId(null);
      return;
    }

    await changeStatus(task, targetStatus);
    setDraggingId(null);
  };

  const boardTasks = useMemo(() => {
    return {
      PENDING: tasks.filter((task) => task.status === "PENDING"),
      IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS"),
      IN_REVIEW: tasks.filter((task) => task.status === "IN_REVIEW"),
      DONE: tasks.filter((task) => task.status === "DONE"),
    };
  }, [tasks]);

  const hasFilters = Boolean(q || status || priority || overdue || project);

  const resetFilters = () => {
    setQ("");
    setStatus("");
    setPriority("");
    setOverdue(false);
    setProject("");
    setOrdering("deadline");
    setPage(1);
  };

  const setStatusFilter = (value) => {
    setStatus(value);
    setOverdue(false);
    setPage(1);
  };

  const changeStatus = async (task, value) => {
    if (busyId !== null || task.status === value) return;

    setErr("");
    setBusyId(task.id);

    try {
      const { data: updatedTask } = await api.patch(`/tasks/${task.id}/`, {
        status: value,
      });

      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          results: current.results.map((item) =>
            item.id === task.id ? updatedTask : item,
          ),
        };
      });
    } catch (error) {
      setErr(errMsg(error));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-7 pb-10">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand">
              <ListFilter size={14} />
              TASK LIFECYCLE
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Task Command Center
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {isMgr
                ? "Track accountability, monitor deadlines, and keep every approved meeting action moving."
                : "Keep track of your assigned work, deadlines, and progress in one place."}
            </p>
          </div>

          <Link
            to={isMgr ? "/meetings" : "/notifications"}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 motion-reduce:transform-none"
          >
            {isMgr ? "View meetings" : "My notifications"}
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Metrics */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Work overview
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Quick filters for the currently loaded page of tasks.
            </p>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
            >
              <RotateCcw size={13} />
              Reset filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <MetricCard
            title="All tasks"
            value={stats.total}
            subtitle="Show all statuses"
            icon={ClipboardList}
            color="bg-brand/10 text-brand"
            active={!status && !overdue}
            onClick={() => {
              setStatus("");
              setOverdue(false);
              setPage(1);
            }}
          />

          <MetricCard
            title="In progress"
            value={stats.progress}
            subtitle="View active work"
            icon={Clock3}
            color="bg-blue-50 text-blue-700"
            active={status === "IN_PROGRESS"}
            onClick={() => setStatusFilter("IN_PROGRESS")}
          />

          <MetricCard
            title="In review"
            value={stats.review}
            subtitle={
              isMgr ? "Proof waiting for you" : "Waiting for your manager"
            }
            icon={ShieldCheck}
            color="bg-amber-50 text-amber-700"
            active={status === "IN_REVIEW"}
            onClick={() => setStatusFilter("IN_REVIEW")}
          />

          <MetricCard
            title="Completed"
            value={stats.done}
            subtitle="View completed tasks"
            icon={CheckCircle2}
            color="bg-emerald-50 text-emerald-700"
            active={status === "DONE"}
            onClick={() => setStatusFilter("DONE")}
          />

          <MetricCard
            title="Overdue"
            value={stats.overdue}
            subtitle="View overdue tasks"
            icon={AlertTriangle}
            color="bg-red-50 text-red-700"
            active={overdue}
            onClick={() => {
              setStatus("");
              setOverdue(true);
              setPage(1);
            }}
          />
        </div>
      </section>

      {/* Toolbar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isMgr ? "Team tasks" : "My tasks"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Search, sort, and organize your task list.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setView("board")}
                aria-pressed={view === "board"}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  view === "board"
                    ? "bg-brand text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid size={15} />
                Board
              </button>

              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  view === "list"
                    ? "bg-brand text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <List size={15} />
                List
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(130px,180px))_auto]">
            <div className="relative min-w-0">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className={`${inputCls} w-full pl-9`}
                placeholder="Search tasks or meetings..."
                aria-label="Search tasks"
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setPage(1);
                }}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <select
              className={`${inputCls} w-full`}
              value={status}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {FILTER_STATUS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {isMgr && (
              <select
                className={`${inputCls} w-full`}
                value={project}
                onChange={(event) => {
                  setProject(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by project"
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <select
              className={`${inputCls} w-full`}
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              {["HIGH", "MEDIUM", "LOW"].map((value) => (
                <option key={value} value={value}>
                  {value[0] + value.slice(1).toLowerCase()}
                </option>
              ))}
            </select>

            <select
              className={`${inputCls} w-full`}
              value={ordering}
              onChange={(event) => {
                setOrdering(event.target.value);
                setPage(1);
              }}
              aria-label="Sort tasks"
            >
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-red-200 hover:bg-red-50/50">
              <input
                type="checkbox"
                checked={overdue}
                onChange={(event) => {
                  setOverdue(event.target.checked);
                  if (event.target.checked) setStatus("");
                  setPage(1);
                }}
                className="accent-red-600"
              />
              <span className="whitespace-nowrap">Overdue only</span>
            </label>
          </div>

          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="text-xs font-semibold text-slate-400">
                ACTIVE FILTERS
              </span>

              {q && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"
                >
                  Search: {q}
                  <X size={12} />
                </button>
              )}

              {status && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("")}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"
                >
                  {FILTER_STATUS.find(([value]) => value === status)?.[1] ||
                    status}
                  <X size={12} />
                </button>
              )}

              {priority && (
                <button
                  type="button"
                  onClick={() => {
                    setPriority("");
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"
                >
                  {priority} priority
                  <X size={12} />
                </button>
              )}

              {overdue && (
                <button
                  type="button"
                  onClick={() => {
                    setOverdue(false);
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                >
                  Overdue only
                  <X size={12} />
                </button>
              )}

              {project && (
                <button
                  type="button"
                  onClick={() => {
                    setProject("");
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"
                >
                  {projects.find((p) => String(p.id) === String(project))
                    ?.name || "Project"}
                  <X size={12} />
                </button>
              )}

              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto text-xs font-semibold text-slate-500 hover:text-brand"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      <ErrorBox msg={err} />

      {!data && !err && <Loading />}

      {data && tasks.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <ClipboardList size={26} />
          </span>
          <h3 className="mt-4 font-semibold text-slate-900">
            {hasFilters || status
              ? "No matching tasks"
              : "Your task board is clear"}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {hasFilters || status
              ? "Try adjusting your filters or clearing them to see more tasks."
              : "Tasks appear here after meeting action items are approved and assigned."}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Kanban Board */}
      {data && tasks.length > 0 && view === "board" && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              Tasks are grouped by status. Open a card for full task details.
            </p>
            <span className="text-xs font-medium text-slate-400">
              {tasks.length} loaded on this page
            </span>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Object.keys(STATUS_META).map((columnStatus) => (
              <KanbanColumn
                key={columnStatus}
                status={columnStatus}
                tasks={boardTasks[columnStatus]}
                isMgr={isMgr}
                busyId={busyId}
                onStatusChange={changeStatus}
                onDropTask={dropTask}
                onDragStart={setDraggingId}
                onDragEnd={() => setDraggingId(null)}
                draggingId={draggingId}
              />
            ))}
          </div>
        </section>
      )}

      {/* Detailed list */}
      {data && tasks.length > 0 && view === "list" && (
        <div className={TABLE}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className={TH}>Task</th>
                <th className={TH}>Project</th>
                <th className={TH}>Meeting</th>
                {isMgr && <th className={TH}>Assignee</th>}
                <th className={TH}>Deadline</th>
                <th className={TH}>Priority</th>
                <th className={TH}>Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4">
                    <Link
                      to={`/tasks/${task.id}`}
                      className="font-semibold text-slate-800 hover:text-brand hover:underline"
                    >
                      {task.title}
                    </Link>
                  </td>

                  <td className="max-w-40 truncate px-4 py-4 text-slate-500">
                    {task.project_name || "—"}
                  </td>

                  <td className="max-w-48 truncate px-4 py-4 text-slate-500">
                    {task.meeting_title || "—"}
                  </td>

                  {isMgr && (
                    <td className="px-4 py-4 text-slate-600">
                      {task.assignee_name || "Unassigned"}
                    </td>
                  )}

                  <td className="whitespace-nowrap px-4 py-4">
                    <span
                      className={
                        getStatus(task) === "OVERDUE"
                          ? "font-semibold text-red-600"
                          : "text-slate-600"
                      }
                    >
                      {task.deadline ? fmtDay(task.deadline) : "No deadline"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <PriorityBadge task={task} />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <TaskStatus task={task} />

                      {!isMgr && (
                        <select
                          aria-label={`Change status for ${task.title}`}
                          disabled={
                            busyId === task.id || task.status === "IN_REVIEW"
                          }
                          value={task.status}
                          onChange={(event) =>
                            changeStatus(task, event.target.value)
                          }
                          className="max-w-36 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand disabled:opacity-50"
                        >
                          {moveOptions(task).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && tasks.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-500">
            Showing the tasks returned for the current page. Use pagination to
            view more.
          </p>
          <Pager data={data} page={page} setPage={setPage} noun="tasks" />
        </div>
      )}
    </div>
  );
}
