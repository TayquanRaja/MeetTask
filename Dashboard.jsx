import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  FolderKanban,
  ListChecks,
  Mic,
  Plus,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api, errMsg } from "../api";
import { useAuth } from "../auth";
import { Badge, Card, Empty, ErrorBox } from "../components/ui";
import { fmtDay, isoDate, timeAgo } from "../utils";

const CSS = `
@keyframes mtRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes mtPing{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.4);opacity:0}}
.mt-rise{animation:mtRise .5s cubic-bezier(.2,.7,.2,1) both}
.mt-ping{animation:mtPing 1.6s ease-out infinite}
`;

/* ---------- helpers ---------- */
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayDiff = (s) =>
  Math.round(
    (new Date(s + "T00:00:00") - new Date(iso(new Date()) + "T00:00:00")) /
      864e5,
  );
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const pretty = (s) => {
  const t = s.replaceAll("_", " ").toLowerCase();
  return t[0].toUpperCase() + t.slice(1);
};
const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);

function dueChip(t) {
  if (!t.deadline) return ["No deadline", "bg-slate-100 text-slate-500"];
  const n = dayDiff(t.deadline);
  if (n < 0) return [`Overdue ${-n}d`, "bg-red-100 text-red-700"];
  if (n === 0) return ["Due today", "bg-amber-100 text-amber-800"];
  if (n === 1) return ["Tomorrow", "bg-amber-50 text-amber-700"];
  if (n < 7) return [`In ${n} days`, "bg-blue-50 text-blue-700"];
  return [fmtDay(t.deadline), "bg-slate-100 text-slate-600"];
}

function useCountUp(target = 0, ms = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      start ??= t;
      const p = Math.min((t - start) / ms, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/* ---------- hero ---------- */
function Hero({ name, role, focus, children }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours();
  const greet =
    h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return (
    <section
      className="mt-rise relative overflow-hidden rounded-3xl p-7 text-white shadow-lg sm:p-9"
      style={{
        background:
          "linear-gradient(135deg,#17233a 0%,#1e2d4a 55%,#1f5c99 135%)",
      }}
    >
      <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-white/[0.04] ring-1 ring-white/10" />
      <div className="pointer-events-none absolute -bottom-40 right-24 h-80 w-80 rounded-full bg-white/[0.03] ring-1 ring-white/10" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sky-200/80">
            {role} workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {greet}, {name}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            {focus}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">{children}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-right backdrop-blur">
          <div className="text-3xl font-semibold tabular-nums">
            {now.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-300">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

const heroBtn =
  "inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-navy-900 transition hover:bg-sky-50";
const heroGhost =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-medium text-white transition hover:bg-white/10";

/* ---------- stat card ---------- */
const TONE = {
  blue: ["bg-brand-soft text-brand", "bg-brand"],
  amber: ["bg-amber-50 text-amber-600", "bg-amber-500"],
  green: ["bg-emerald-50 text-emerald-600", "bg-emerald-500"],
  red: ["bg-red-50 text-red-600", "bg-red-500"],
  slate: ["bg-slate-100 text-slate-600", "bg-slate-400"],
};

function Stat({ to, label, value, icon: Icon, tone = "blue", hint, i = 0 }) {
  const n = useCountUp(value);
  const [chip, bar] = TONE[tone];
  const body = (
    <div
      className="mt-rise group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${i * 60}ms` }}
    >
      <span
        className={`absolute inset-x-0 top-0 h-1 ${bar} opacity-0 transition group-hover:opacity-100`}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${chip}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-navy-900">
        {n}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

/* ---------- donut ring ---------- */
function Ring({ segments, empty = "No data yet" }) {
  const [hi, setHi] = useState(null);
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const lead = segments[0];
  const pct = total ? Math.round((lead.value / total) * 100) : 0;
  const shown = hi !== null ? segments[hi] : null;
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="#eef1f5"
            strokeWidth="14"
          />
          {total > 0 &&
            segments.map((s, i) => {
              const len = (s.value / total) * C;
              const el = (
                <circle
                  key={s.label}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hi === i ? 19 : 14}
                  strokeDasharray={`${Math.max(len - 2, 0)} ${C}`}
                  strokeDashoffset={-offset}
                  style={{ transition: "stroke-width .2s", cursor: "pointer" }}
                  onMouseEnter={() => setHi(i)}
                  onMouseLeave={() => setHi(null)}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-semibold tabular-nums text-navy-900">
            {shown ? shown.value : total ? `${pct}%` : "—"}
          </div>
          <div className="text-xs text-slate-500">
            {shown ? shown.label : total ? lead.label : empty}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {segments.map((s, i) => (
          <button
            key={s.label}
            onMouseEnter={() => setHi(i)}
            onMouseLeave={() => setHi(null)}
            className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs transition ${hi === i ? "bg-slate-100" : ""}`}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-slate-600">{s.label}</span>
            <span className="font-semibold text-navy-900">{s.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- workflow pipeline (manager) ---------- */
function Pipeline({ d }) {
  const stages = [
    {
      label: "Captured",
      v: d.total_meetings,
      sub: "Meetings",
      icon: Mic,
      to: "/meetings",
    },
    {
      label: "In review",
      v: d.awaiting_review,
      sub: "Awaiting you",
      icon: ShieldCheck,
      to: "/meetings",
      hot: d.awaiting_review > 0,
    },
    {
      label: "Approved",
      v: d.approved_meetings,
      sub: "Outputs approved",
      icon: Check,
      to: "/meetings",
    },
    {
      label: "Active",
      v: d.active_tasks,
      sub: "Open tasks",
      icon: ListChecks,
      to: "/tasks",
    },
    {
      label: "Delivered",
      v: d.completed_tasks,
      sub: "Completed",
      icon: CheckCircle2,
      to: "/tasks",
    },
  ];
  return (
    <Card title="From discussion to delivery">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {stages.map((s, i) => (
          <Fragment key={s.label}>
            {i > 0 && (
              <ArrowRight
                size={18}
                className="hidden shrink-0 self-center text-slate-300 sm:block"
              />
            )}
            <Link
              to={s.to}
              className={`group relative flex-1 rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                s.hot
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-200 bg-slate-50/60 hover:bg-white"
              }`}
            >
              {s.hot && (
                <span className="absolute right-3 top-3 flex h-2.5 w-2.5">
                  <span className="mt-ping absolute inline-flex h-full w-full rounded-full bg-amber-500" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                </span>
              )}
              <s.icon
                size={18}
                className={s.hot ? "text-amber-600" : "text-brand"}
              />
              <div className="mt-3 text-2xl font-semibold tabular-nums text-navy-900">
                {s.v}
              </div>
              <div className="text-sm font-medium text-slate-700">
                {s.label}
              </div>
              <div className="text-xs text-slate-400">{s.sub}</div>
            </Link>
          </Fragment>
        ))}
      </div>
    </Card>
  );
}

/* ---------- task panel: week strip + tabs + quick actions ---------- */
const PRI = { HIGH: "bg-red-500", MEDIUM: "bg-brand", LOW: "bg-slate-300" };

function TaskPanel({ tasks, setTasks, showAssignee, onChanged, canUpdate }) {
  const [view, setView] = useState({ t: "week" });
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const active = useMemo(
    () => tasks.filter((t) => t.status !== "DONE"),
    [tasks],
  );
  const overdue = active.filter((t) => t.is_overdue);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const x = new Date();
        x.setDate(x.getDate() + i);
        return {
          key: iso(x),
          wd:
            i === 0
              ? "Today"
              : x.toLocaleDateString(undefined, { weekday: "short" }),
          num: x.getDate(),
        };
      }),
    [],
  );

  const rows =
    view.t === "overdue"
      ? overdue
      : view.t === "day"
        ? active.filter((t) => t.deadline === view.day)
        : view.t === "all"
          ? active
          : active.filter(
              (t) => t.is_overdue || (t.deadline && dayDiff(t.deadline) <= 7),
            );

  const setStatus = async (t, status) => {
    setBusy(t.id);
    setErr("");
    try {
      const { data } = await api.patch(`/tasks/${t.id}/`, { status });
      setTasks((list) => list.map((x) => (x.id === t.id ? data : x)));
      onChanged();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const tab = (on) =>
    `rounded-full px-3.5 py-1.5 text-xs font-medium transition ${on ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`;

  return (
    <Card
      title="Task focus"
      action={
        <Link
          to="/tasks"
          className="text-xs font-medium text-brand hover:underline"
        >
          View all tasks →
        </Link>
      }
    >
      {/* week strip */}
      <div className="mb-4 grid grid-cols-7 gap-2">
        {days.map((dy) => {
          const n = active.filter((t) => t.deadline === dy.key).length;
          const on = view.t === "day" && view.day === dy.key;
          return (
            <button
              key={dy.key}
              onClick={() =>
                setView(on ? { t: "week" } : { t: "day", day: dy.key })
              }
              className={`rounded-xl border px-1 py-2.5 text-center transition ${
                on
                  ? "border-brand bg-brand text-white shadow-md"
                  : "border-slate-200 bg-white hover:border-brand/50 hover:bg-brand-soft/60"
              }`}
            >
              <div
                className={`text-[10px] font-medium uppercase tracking-wide ${on ? "text-sky-100" : "text-slate-400"}`}
              >
                {dy.wd}
              </div>
              <div className="text-lg font-semibold leading-tight">
                {dy.num}
              </div>
              <div
                className={`mx-auto mt-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold ${
                  n === 0
                    ? on
                      ? "text-sky-100"
                      : "text-slate-300"
                    : on
                      ? "bg-white text-brand"
                      : "bg-brand text-white"
                }`}
              >
                {n}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          className={tab(view.t === "week")}
          onClick={() => setView({ t: "week" })}
        >
          Needs attention
        </button>
        <button
          className={tab(view.t === "overdue")}
          onClick={() => setView({ t: "overdue" })}
        >
          Overdue{overdue.length ? ` (${overdue.length})` : ""}
        </button>
        <button
          className={tab(view.t === "all")}
          onClick={() => setView({ t: "all" })}
        >
          All active ({active.length})
        </button>
        {view.t === "day" && (
          <span className={tab(true)}>{fmtDay(view.day)}</span>
        )}
      </div>

      <ErrorBox msg={err} />
      {rows.length === 0 ? (
        <Empty
          text={
            view.t === "overdue"
              ? "Nothing overdue. Nice work."
              : "No tasks here."
          }
        />
      ) : (
        <ul className="space-y-1">
          {rows.map((t) => {
            const [label, cls] = dueChip(t);
            return (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50"
              >
                <span
                  className={`h-9 w-1 shrink-0 rounded-full ${PRI[t.priority]}`}
                  title={`${t.priority} priority`}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/tasks/${t.id}`}
                    className="block truncate text-sm font-medium text-navy-900 hover:text-brand"
                  >
                    {t.title}
                  </Link>
                  <div className="truncate text-xs text-slate-500">
                    {t.project_name || t.meeting_title || "Unlinked"}
                    {showAssignee && ` · ${t.assignee_name}`}
                  </div>
                </div>
                <span
                  className={`hidden whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline ${cls}`}
                >
                  {label}
                </span>
                <span className="hidden md:inline">
                  <Badge value={t.status} />
                </span>
                {canUpdate && t.status === "IN_REVIEW" && (
                  <Link
                    to={`/tasks/${t.id}`}
                    className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                  >
                    Waiting for review
                  </Link>
                )}
                {!canUpdate && t.status === "IN_REVIEW" && (
                  <Link
                    to={`/tasks/${t.id}`}
                    className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                  >
                    Review proof
                  </Link>
                )}
                {canUpdate && t.status !== "IN_REVIEW" && (
                  <div className="flex items-center gap-1.5">
                    {t.status === "PENDING" && (
                      <button
                        disabled={busy === t.id}
                        onClick={() => setStatus(t, "IN_PROGRESS")}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand disabled:opacity-50"
                      >
                        Start
                      </button>
                    )}
                    {t.proof_required ? (
                      <Link
                        title="Submit proof to finish"
                        to={`/tasks/${t.id}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-brand hover:bg-brand hover:text-white"
                      >
                        <ShieldCheck size={15} />
                      </Link>
                    ) : (
                      <button
                        title="Mark as done"
                        disabled={busy === t.id}
                        onClick={() => setStatus(t, "DONE")}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-emerald-500 hover:bg-emerald-500 hover:text-white disabled:opacity-50"
                      >
                        <Check size={15} />
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {tasks.length >= 20 && (
        <p className="mt-3 text-xs text-slate-400">
          Showing your 20 nearest-deadline tasks.
        </p>
      )}
    </Card>
  );
}

/* ---------- meetings + activity ---------- */
function MeetingsCard({ meetings, isMgr }) {
  const list = [...meetings]
    .sort(
      (a, b) =>
        (b.status === "PENDING_REVIEW") - (a.status === "PENDING_REVIEW"),
    )
    .slice(0, 5);
  return (
    <Card
      title={isMgr ? "Review queue & meetings" : "My meetings"}
      action={
        <Link
          to="/meetings"
          className="text-xs font-medium text-brand hover:underline"
        >
          All →
        </Link>
      }
    >
      {list.length === 0 ? (
        <Empty text="No meetings yet." />
      ) : (
        <ul className="space-y-2">
          {list.map((m) => {
            const pending = isMgr && m.status === "PENDING_REVIEW";
            return (
              <li
                key={m.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${pending ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${pending ? "bg-amber-100 text-amber-700" : "bg-brand-soft text-brand"}`}
                >
                  <CalendarDays size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/meetings/${m.id}`}
                    className="block truncate text-sm font-medium text-navy-900 hover:text-brand"
                  >
                    {m.title}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {new Date(m.scheduled_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
                {pending ? (
                  <Link
                    to={`/meetings/${m.id}/review`}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                  >
                    Review
                  </Link>
                ) : (
                  <Badge value={m.status} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function UpcomingCard({ meetings }) {
  const list = [...meetings]
    .filter((m) => new Date(m.scheduled_at) >= Date.now() - 60 * 60 * 1000)
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    .slice(0, 5);
  return (
    <Card
      title="Upcoming meetings"
      action={
        <Link
          to="/planner"
          className="text-xs font-medium text-brand hover:underline"
        >
          Calendar →
        </Link>
      }
    >
      {list.length === 0 ? (
        <Empty text="No upcoming meetings." />
      ) : (
        <ul className="space-y-2">
          {list.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                <CalendarDays size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/meetings/${m.id}`}
                  className="block truncate text-sm font-medium text-navy-900 hover:text-brand"
                >
                  {m.title}
                </Link>
                <div className="text-xs text-slate-500">
                  {new Date(m.scheduled_at).toLocaleString(undefined, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {m.project_name ? ` · ${m.project_name}` : ""}
                </div>
              </div>
              <Badge value={m.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TodoMini({ todos, reload }) {
  const [title, setTitle] = useState("");
  const open = todos.filter((t) => !t.is_done).slice(0, 6);
  const add = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post("/todos/", {
      title: title.trim(),
      due_date: isoDate(new Date()),
    });
    setTitle("");
    reload();
  };
  const toggle = async (t) => {
    await api.patch(`/todos/${t.id}/`, { is_done: !t.is_done });
    reload();
  };
  return (
    <Card
      title="My to-do list"
      action={
        <Link
          to="/planner"
          className="text-xs font-medium text-brand hover:underline"
        >
          Planner →
        </Link>
      }
    >
      <form onSubmit={add} className="mb-3 flex gap-2">
        <input
          className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
          placeholder="Add something for yourself…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
          <Plus size={16} />
        </button>
      </form>
      {open.length === 0 ? (
        <Empty text="Personal list is clear." />
      ) : (
        <ul className="space-y-1">
          {open.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              <button
                onClick={() => toggle(t)}
                className="grid h-6 w-6 place-items-center rounded-md border border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-600"
              >
                <Check size={13} />
              </button>
              <span className="truncate text-sm text-navy-900">{t.title}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ProjectsMini({ projects }) {
  const list = (projects || []).slice(0, 4);
  return (
    <Card
      title="Projects"
      action={
        <Link
          to="/projects"
          className="text-xs font-medium text-brand hover:underline"
        >
          All →
        </Link>
      }
    >
      {list.length === 0 ? (
        <Empty text="Create a project to group meetings and backlog work." />
      ) : (
        <ul className="space-y-3">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                to={`/projects/${p.id}`}
                className="block text-sm font-medium text-navy-900 hover:text-brand"
              >
                {p.name}
              </Link>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${p.stats?.progress || 0}%`,
                    background: p.color,
                  }}
                />
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {p.stats?.done || 0}/{p.stats?.total || 0} done
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ActivityCard({ notes }) {
  const nav = useNavigate();
  const list = notes.slice(0, 5);
  return (
    <Card
      title="Recent activity"
      action={
        <Link
          to="/notifications"
          className="text-xs font-medium text-brand hover:underline"
        >
          All →
        </Link>
      }
    >
      {list.length === 0 ? (
        <Empty text="No notifications yet." />
      ) : (
        <ul className="space-y-1">
          {list.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => n.link && nav(n.link)}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
              >
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${n.is_read ? "bg-slate-100 text-slate-400" : "bg-brand text-white"}`}
                >
                  <Bell size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm ${n.is_read ? "text-slate-700" : "font-semibold text-navy-900"}`}
                  >
                    {n.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {timeAgo(n.created_at)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- admin bars ---------- */
function BarList({ data, colors = {} }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);
  const entries = Object.entries(data || {});
  const max = Math.max(...entries.map(([, v]) => v), 1);
  if (!entries.length) return <Empty text="No data yet." />;
  return (
    <ul className="space-y-3">
      {entries.map(([k, v]) => (
        <li key={k}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-slate-600">{pretty(k)}</span>
            <span className="font-semibold tabular-nums text-navy-900">
              {v}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: ready ? `${(v / max) * 100}%` : "0%",
                background: colors[k] || "#1f5c99",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- role views ---------- */
function ManagerView({
  d,
  tasks,
  setTasks,
  meetings,
  notes,
  reload,
  user,
  todos,
  projects,
  reloadPlanner,
}) {
  const focus =
    d.proofs_awaiting > 0
      ? `${plural(d.proofs_awaiting, "task")} ${d.proofs_awaiting === 1 ? "has" : "have"} proof waiting for your review.`
      : d.overdue_tasks > 0
        ? `${plural(d.overdue_tasks, "task")} across your meetings ${d.overdue_tasks === 1 ? "is" : "are"} overdue.`
        : d.awaiting_review > 0
          ? `${plural(d.awaiting_review, "meeting")} ${d.awaiting_review === 1 ? "is" : "are"} waiting for your review. No tasks start until you approve.`
          : "Everything is on track. Create a meeting to capture the next set of decisions.";
  const done = d.completed_tasks;
  const onTrack = Math.max(d.active_tasks - d.overdue_tasks, 0);
  return (
    <>
      <Hero name={user.name.split(" ")[0]} role="Manager" focus={focus}>
        {user.can_create_meetings && (
          <Link to="/meetings/new" className={heroBtn}>
            <Plus size={16} /> New meeting
          </Link>
        )}
        <Link to="/projects" className={heroGhost}>
          <FolderKanban size={16} /> Create a project
        </Link>
        {d.proofs_awaiting > 0 && (
          <Link to="/tasks?status=IN_REVIEW" className={heroGhost}>
            <ShieldCheck size={16} /> Proof to review ({d.proofs_awaiting})
          </Link>
        )}
        {d.awaiting_review > 0 && (
          <Link to="/meetings" className={heroGhost}>
            <ShieldCheck size={16} /> Review queue ({d.awaiting_review})
          </Link>
        )}
        <Link to="/analytics" className={heroGhost}>
          Weekly analytics
        </Link>
      </Hero>
      {d.proofs_awaiting > 0 && (
        <Link
          to="/tasks?status=IN_REVIEW"
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 transition hover:bg-amber-100"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500 text-white">
            <ShieldCheck size={18} />
          </span>
          <span className="flex-1">
            <span className="font-semibold">
              {plural(d.proofs_awaiting, "task")} to review.
            </span>{" "}
            Employees have submitted proof of completion and are waiting for
            your decision.
          </span>
          <span className="font-medium">Review →</span>
        </Link>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Stat
          i={0}
          to="/meetings"
          label="Total meetings"
          value={d.total_meetings}
          icon={CalendarDays}
        />
        <Stat
          i={1}
          to="/meetings"
          label="Awaiting review"
          value={d.awaiting_review}
          icon={ClipboardList}
          tone="amber"
        />
        <Stat
          i={2}
          to="/meetings"
          label="Approved"
          value={d.approved_meetings}
          icon={Check}
          tone="green"
        />
        <Stat
          i={3}
          to="/tasks"
          label="Active tasks"
          value={d.active_tasks}
          icon={ListChecks}
        />
        <Stat
          i={4}
          to="/tasks"
          label="Completed"
          value={d.completed_tasks}
          icon={CheckCircle2}
          tone="green"
        />
        <Stat
          i={5}
          to="/tasks"
          label="Overdue"
          value={d.overdue_tasks}
          icon={Clock}
          tone="red"
        />
      </div>
      <Pipeline d={d} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TaskPanel
            tasks={tasks}
            setTasks={setTasks}
            showAssignee
            onChanged={reload}
          />
          <UpcomingCard meetings={meetings} />
          <ActivityCard notes={notes} />
        </div>
        <div className="space-y-6">
          <Card title="Task completion">
            <Ring
              segments={[
                { label: "Completed", value: done, color: "#10b981" },
                { label: "On track", value: onTrack, color: "#1f5c99" },
                { label: "Overdue", value: d.overdue_tasks, color: "#dc2626" },
              ]}
              empty="No tasks yet"
            />
          </Card>
          <ProjectsMini projects={projects} />
          <TodoMini todos={todos} reload={reloadPlanner} />
          <MeetingsCard meetings={meetings} isMgr />
        </div>
      </div>
    </>
  );
}

function EmployeeView({
  d,
  tasks,
  setTasks,
  meetings,
  notes,
  reload,
  user,
  todos,
  reloadPlanner,
}) {
  const focus =
    d.overdue_tasks > 0
      ? `You have ${plural(d.overdue_tasks, "overdue task")}. Start with those first.`
      : d.upcoming_deadlines > 0
        ? `${plural(d.upcoming_deadlines, "task")} due in the next 7 days.`
        : "No upcoming deadlines. Check your tasks for anything new.";
  const open = Math.max(
    d.assigned_tasks - d.completed_tasks - d.overdue_tasks,
    0,
  );
  return (
    <>
      <Hero name={user.name.split(" ")[0]} role="Employee" focus={focus}>
        <Link to="/tasks" className={heroBtn}>
          <ListChecks size={16} /> My tasks
        </Link>
        {user.can_create_meetings && (
          <Link to="/meetings/new" className={heroGhost}>
            <Plus size={16} /> New meeting
          </Link>
        )}
        <Link to="/planner" className={heroGhost}>
          <CalendarDays size={16} /> Planner
        </Link>
      </Hero>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Stat
          i={0}
          to="/tasks"
          label="Assigned"
          value={d.assigned_tasks}
          icon={ClipboardList}
        />
        <Stat
          i={1}
          to="/tasks"
          label="Due in 7 days"
          value={d.upcoming_deadlines}
          icon={CalendarDays}
          tone="amber"
        />
        <Stat
          i={2}
          to="/tasks"
          label="In progress"
          value={d.in_progress}
          icon={ListChecks}
        />
        <Stat
          i={3}
          to="/tasks"
          label="Completed"
          value={d.completed_tasks}
          icon={CheckCircle2}
          tone="green"
        />
        <Stat
          i={4}
          to="/tasks?status=IN_REVIEW"
          label="In review"
          value={d.in_review}
          icon={ShieldCheck}
          tone="amber"
        />
        <Stat
          i={5}
          to="/tasks"
          label="Overdue"
          value={d.overdue_tasks}
          icon={AlertTriangle}
          tone="red"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TaskPanel
            tasks={tasks}
            setTasks={setTasks}
            onChanged={reload}
            canUpdate
          />
          <UpcomingCard meetings={meetings} />
          <ActivityCard notes={notes} />
        </div>
        <div className="space-y-6">
          <Card title="My progress">
            <Ring
              segments={[
                {
                  label: "Completed",
                  value: d.completed_tasks,
                  color: "#10b981",
                },
                { label: "Open", value: open, color: "#1f5c99" },
                { label: "Overdue", value: d.overdue_tasks, color: "#dc2626" },
              ]}
              empty="No tasks yet"
            />
          </Card>
          <TodoMini todos={todos} reload={reloadPlanner} />
          <MeetingsCard meetings={meetings} />
        </div>
      </div>
    </>
  );
}

function AdminView({ d, notes, user }) {
  const tasksTotal = sum(d.tasks);
  return (
    <>
      <Hero
        name={user.name.split(" ")[0]}
        role="Admin"
        focus={`${plural(d.active_users, "active user")} across the workspace. Review recent activity below.`}
      >
        <Link to="/users" className={heroBtn}>
          <Users size={16} /> Manage users
        </Link>
        <Link to="/audit" className={heroGhost}>
          <ScrollText size={16} /> Audit logs
        </Link>
      </Hero>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          i={0}
          to="/users"
          label="Active users"
          value={d.active_users}
          icon={Users}
        />
        <Stat
          i={1}
          to="/users"
          label="Total users"
          value={sum(d.users)}
          icon={Users}
          tone="slate"
        />
        <Stat
          i={2}
          label="Meetings"
          value={sum(d.meetings)}
          icon={CalendarDays}
          tone="amber"
        />
        <Stat
          i={3}
          label="Tasks"
          value={tasksTotal}
          icon={ListChecks}
          tone="green"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Users by role">
          <BarList
            data={d.users}
            colors={{
              ADMIN: "#17233a",
              MANAGER: "#1f5c99",
              EMPLOYEE: "#94a3b8",
            }}
          />
        </Card>
        <Card title="Meetings by status">
          <BarList
            data={d.meetings}
            colors={{
              APPROVED: "#10b981",
              PENDING_REVIEW: "#f59e0b",
              PROCESSING: "#f59e0b",
              REJECTED: "#dc2626",
              FAILED: "#dc2626",
              DRAFT: "#94a3b8",
            }}
          />
        </Card>
        <Card title="Tasks by status">
          <Ring
            segments={[
              { label: "Done", value: d.tasks.DONE || 0, color: "#10b981" },
              {
                label: "In progress",
                value: d.tasks.IN_PROGRESS || 0,
                color: "#1f5c99",
              },
              {
                label: "Pending",
                value: d.tasks.PENDING || 0,
                color: "#cbd5e1",
              },
            ]}
            empty="No tasks yet"
          />
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Recent audit events"
          className="lg:col-span-2"
          action={
            <Link
              to="/audit"
              className="text-xs font-medium text-brand hover:underline"
            >
              Full log →
            </Link>
          }
        >
          {d.recent_audit.length === 0 ? (
            <Empty text="No audit events yet." />
          ) : (
            <ol className="space-y-4 border-l border-slate-200 pl-5">
              {d.recent_audit.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-brand" />
                  <div className="font-mono text-xs text-navy-900">
                    {a.action}
                  </div>
                  <div className="text-xs text-slate-500">
                    {a.actor_name || "system"} · {a.target_type} {a.target_id} ·{" "}
                    {timeAgo(a.created_at)}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <ActivityCard notes={notes} />
      </div>
    </>
  );
}

/* ---------- page ---------- */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-48 rounded-3xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-slate-200" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";
  const [d, setD] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [notes, setNotes] = useState([]);
  const [todos, setTodos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [err, setErr] = useState("");
  const [spin, setSpin] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    setSpin(true);
    try {
      const calls = [api.get("/dashboard/"), api.get("/notifications/")];
      if (!isAdmin) {
        calls.push(
          api.get("/tasks/", { params: { ordering: "deadline" } }),
          api.get("/meetings/"),
          api.get("/todos/"),
        );
      }
      if (user.role === "MANAGER")
        calls.push(api.get("/projects/", { params: { status: "ACTIVE" } }));
      const [dd, nn, tt, mm, td, pp] = await Promise.all(calls);
      setD(dd.data);
      setNotes(nn.data.results);
      if (tt) setTasks(tt.data.results);
      if (mm) setMeetings(mm.data.results);
      if (td) setTodos(td.data);
      if (pp) setProjects(pp.data);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setSpin(false);
    }
  }, [isAdmin, user.role]);

  useEffect(() => {
    load();
  }, [load]);

  const reloadStats = useCallback(() => {
    api
      .get("/dashboard/")
      .then((r) => setD(r.data))
      .catch(() => {});
  }, []);

  const reloadPlanner = useCallback(() => {
    api
      .get("/todos/")
      .then((r) => setTodos(r.data))
      .catch(() => {});
    if (user.role === "MANAGER")
      api
        .get("/projects/", { params: { status: "ACTIVE" } })
        .then((r) => setProjects(r.data))
        .catch(() => {});
  }, [user.role]);

  if (err && !d) return <ErrorBox msg={err} />;
  if (!d) return <Skeleton />;

  const props = {
    d,
    tasks,
    setTasks,
    meetings,
    notes,
    reload: reloadStats,
    user,
    todos,
    projects,
    reloadPlanner,
  };

  return (
    <div className="space-y-6">
      <style>{CSS}</style>
      <div className="flex justify-end">
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-brand"
        >
          <RefreshCw size={14} className={spin ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <ErrorBox msg={err} />
      {user.role === "MANAGER" && <ManagerView {...props} />}
      {user.role === "EMPLOYEE" && <EmployeeView {...props} />}
      {isAdmin && <AdminView {...props} />}
    </div>
  );
}
