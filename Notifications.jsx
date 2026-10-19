import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  CircleCheck,
  FileCheck2,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { api, errMsg } from "../api";
import {
  Btn,
  Empty,
  ErrorBox,
  Loading,
  PageHeader,
  Pager,
} from "../components/ui";
import { timeAgo } from "../utils";

const EMAIL = {
  SENT: ["Email sent", "text-emerald-600"],
  FAILED: ["Email failed", "text-red-600"],
  NOT_CONFIGURED: ["In-app only (email not configured)", "text-slate-400"],
};

// Proof notifications get their own icon and colour so a manager can spot submissions at a glance.
const KIND = {
  PROOF_SUBMITTED: {
    icon: FileCheck2,
    read: "bg-amber-100 text-amber-700",
    unread: "bg-amber-500 text-white",
    tag: "Needs your review",
  },
  PROOF_WITHDRAWN: {
    icon: Undo2,
    read: "bg-slate-100 text-slate-400",
    unread: "bg-slate-500 text-white",
    tag: "Withdrawn",
  },
  PROOF_APPROVED: {
    icon: CircleCheck,
    read: "bg-emerald-100 text-emerald-600",
    unread: "bg-emerald-600 text-white",
    tag: "Approved",
  },
  PROOF_CHANGES: {
    icon: RotateCcw,
    read: "bg-red-100 text-red-500",
    unread: "bg-red-600 text-white",
    tag: "Changes requested",
  },
};

export default function Notifications() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState("");

  const load = useCallback(
    () =>
      api
        .get("/notifications/", { params: { page } })
        .then((r) => setData(r.data))
        .catch((e) => setErr(errMsg(e))),
    [page],
  );
  useEffect(() => {
    load();
  }, [load]);

  const ping = () => window.dispatchEvent(new Event("mt:notifications"));

  const open = async (n) => {
    if (!n.is_read) {
      try {
        await api.post(`/notifications/${n.id}/read/`);
        ping();
      } catch {
        /* ignore */
      }
    }
    if (n.link) nav(n.link);
    else load();
  };

  const markAll = async () => {
    try {
      await api.post("/notifications/mark_all_read/");
      ping();
      load();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const unread = data ? data.results.filter((n) => !n.is_read).length : 0;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Review requests, task assignments and reminders."
      >
        <Btn variant="secondary" onClick={markAll} disabled={!unread}>
          <CheckCheck size={16} /> Mark all as read
        </Btn>
      </PageHeader>
      <ErrorBox msg={err} />
      {!data && !err && <Loading />}
      {data && data.results.length === 0 && (
        <Empty text="You're all caught up. No notifications yet." />
      )}
      {data && data.results.length > 0 && (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {data.results.map((n) => {
            const k = KIND[n.kind];
            const Icon = k?.icon || Bell;
            return (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50 ${n.is_read ? "" : "bg-brand-soft/50"}`}
              >
                <span
                  className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    n.is_read
                      ? k?.read || "bg-slate-100 text-slate-400"
                      : k?.unread || "bg-brand text-white"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-sm ${n.is_read ? "text-slate-700" : "font-semibold text-navy-900"}`}
                    >
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-brand" />
                    )}
                    {k?.tag && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {k.tag}
                      </span>
                    )}
                  </span>
                  {n.message && (
                    <span className="mt-0.5 block text-sm text-slate-500">
                      {n.message}
                    </span>
                  )}
                  <span className="mt-1 block text-xs text-slate-400">
                    {timeAgo(n.created_at)} ·{" "}
                    <span className={EMAIL[n.email_status]?.[1]}>
                      {EMAIL[n.email_status]?.[0]}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      <Pager data={data} page={page} setPage={setPage} noun="notifications" />
    </>
  );
}
