import { useEffect } from "react";
import { X } from "lucide-react";

export const inputCls =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:bg-slate-50 disabled:text-slate-500";
export const areaCls = inputCls.replace("h-10 ", "py-2 ");
export const TABLE =
  "overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm";
export const TH =
  "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500";

export function Loading({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 text-sm text-slate-500">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      {text}
    </div>
  );
}

export function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {msg}
    </div>
  );
}

export function Notice({ msg, tone = "green" }) {
  if (!msg) return null;
  const c =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-amber-300 bg-amber-50 text-amber-800";
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${c}`}>{msg}</div>
  );
}

export function Empty({ text = "Nothing here yet." }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

const VAR = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-600 hover:bg-slate-100",
};
export const btnCls = (variant = "primary") =>
  `inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VAR[variant]}`;

export function Btn({ variant = "primary", className = "", ...p }) {
  return (
    <button
      type="button"
      {...p}
      className={`${btnCls(variant)} ${className}`}
    />
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Card({ title, action, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const TONES = {
  blue: ["text-brand", "bg-brand-soft text-brand"],
  red: ["text-red-600", "bg-red-50 text-red-600"],
  green: ["text-emerald-600", "bg-emerald-50 text-emerald-600"],
  gray: ["text-slate-700", "bg-slate-100 text-slate-600"],
  amber: ["text-amber-600", "bg-amber-50 text-amber-600"],
};

export function StatCard({ label, value, tone = "blue", icon: Icon }) {
  const [txt, chip] = TONES[tone] || TONES.blue;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        {Icon && (
          <span
            className={`grid h-9 w-9 place-items-center rounded-lg ${chip}`}
          >
            <Icon size={18} />
          </span>
        )}
      </div>
      <div className={`mt-3 text-3xl font-semibold tracking-tight ${txt}`}>
        {value ?? 0}
      </div>
    </div>
  );
}

const COLORS = {
  PENDING: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-800",
  SUBMITTED: "bg-amber-100 text-amber-800",
  CHANGES_REQUESTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-slate-200 text-slate-600",
  DONE: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-slate-100 text-slate-700",
  PROCESSING: "bg-amber-100 text-amber-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  FAILED: "bg-red-100 text-red-700",
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-red-100 text-red-700",
  ADMIN: "bg-navy-900 text-white",
  MANAGER: "bg-blue-100 text-blue-800",
  EMPLOYEE: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-200 text-slate-600",
  OVERDUE: "bg-red-100 text-red-700",
  BACKLOG: "bg-slate-100 text-slate-700",
  ARCHIVED: "bg-slate-200 text-slate-600",
};

export function Badge({ value }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[value] || "bg-slate-100 text-slate-700"}`}
    >
      {String(value).replaceAll("_", " ")}
    </span>
  );
}

export function Avatar({ name = "?", size = 36 }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white"
    >
      {initials}
    </span>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${wide ? "max-w-2xl" : "max-w-md"}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({
  title,
  text,
  confirmLabel = "Confirm",
  danger,
  busy,
  onConfirm,
  onClose,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-slate-600">{text}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Btn>
        <Btn
          variant={danger ? "danger" : "primary"}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Working..." : confirmLabel}
        </Btn>
      </div>
    </Modal>
  );
}

export function Pager({ data, page, setPage, noun }) {
  if (!data || (!data.previous && !data.next)) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <Btn
        variant="secondary"
        disabled={!data.previous}
        onClick={() => setPage(page - 1)}
      >
        Previous
      </Btn>
      <span className="text-slate-500">
        Page {page} · {data.count} {noun}
      </span>
      <Btn
        variant="secondary"
        disabled={!data.next}
        onClick={() => setPage(page + 1)}
      >
        Next
      </Btn>
    </div>
  );
}
