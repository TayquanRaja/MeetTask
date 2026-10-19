import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errMsg } from "../api";
import { useAuth } from "../auth";
import {
  Badge,
  Btn,
  Card,
  ErrorBox,
  Loading,
  Notice,
  inputCls,
} from "../components/ui";
import ProofSection from "../components/ProofPanel";
import { fmtDateTime, fmtDay, timeAgo } from "../utils";

const STATUS = [
  ["PENDING", "Pending"],
  ["IN_PROGRESS", "In progress"],
  ["DONE", "Done"],
];
const PROOF_STATUS = STATUS.filter(([v]) => v !== "DONE");

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-800">{children}</span>
    </div>
  );
}

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isMgr = user.role === "MANAGER";
  const [t, setT] = useState(null);
  const [people, setPeople] = useState([]);
  const [f, setF] = useState({
    priority: "MEDIUM",
    deadline: "",
    assignee: "",
    proof_required: false,
  });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/tasks/${id}/`);
      setT(data);
      setF({
        priority: data.priority,
        deadline: data.deadline || "",
        assignee: String(data.assignee),
        proof_required: !!data.proof_required,
      });
      if (isMgr) {
        if (data.meeting) {
          const m = await api.get(`/meetings/${data.meeting}/`);
          setPeople(m.data.participants);
        } else {
          const emp = await api.get("/employees/");
          setPeople(emp.data);
        }
      }
    } catch (e) {
      setErr(errMsg(e));
    }
  }, [id, isMgr]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (body, okMsg) => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await api.patch(`/tasks/${id}/`, body);
      await load();
      setMsg(okMsg);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (!t) return err ? <ErrorBox msg={err} /> : <Loading />;

  return (
    <>
      <Link to="/tasks" className="text-sm text-brand hover:underline">
        ← Back to tasks
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
          {t.title}
        </h1>
        <Badge value={t.status} />
        <Badge value={t.priority} />
        {t.is_overdue && <Badge value="OVERDUE" />}
      </div>
      <ErrorBox msg={err} />
      <Notice msg={msg} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Description">
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {t.description || "No description."}
            </p>
          </Card>

          {t.status === "IN_REVIEW" ? null : (
            <Card title="Update status">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                {(t.proof_required && !isMgr ? PROOF_STATUS : STATUS).map(
                  ([v, l]) => (
                    <button
                      key={v}
                      disabled={busy}
                      onClick={() =>
                        t.status !== v &&
                        patch({ status: v }, "Status updated.")
                      }
                      className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                        t.status === v
                          ? "bg-white text-brand shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {l}
                    </button>
                  ),
                )}
              </div>
              {t.proof_required && !isMgr && (
                <p className="mt-3 text-sm text-slate-500">
                  To finish this task, submit proof below. It closes when your
                  manager approves.
                </p>
              )}
            </Card>
          )}

          {(t.proof_required ||
            t.status === "IN_REVIEW" ||
            (t.proofs || []).length > 0 ||
            !isMgr) && (
            <Card title="Proof of completion">
              <ProofSection
                task={t}
                isMgr={isMgr}
                reload={load}
                onNotice={(m) => {
                  setErr("");
                  setMsg(m);
                }}
                onError={(m) => {
                  setMsg("");
                  setErr(m);
                }}
              />
            </Card>
          )}

          <Card title="History">
            {t.history.length === 0 ? (
              <p className="text-sm text-slate-500">No history yet.</p>
            ) : (
              <ol className="space-y-4 border-l border-slate-200 pl-5">
                {t.history.map((h, i) => (
                  <li key={i} className="relative text-sm">
                    <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-brand" />
                    <div className="text-slate-800">{h.description}</div>
                    <div className="text-xs text-slate-500">
                      {h.actor} · {timeAgo(h.created_at)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Details">
            <div className="divide-y divide-slate-100">
              <Row label="Project">
                {t.project && isMgr ? (
                  <Link
                    to={`/projects/${t.project}`}
                    className="text-brand hover:underline"
                  >
                    {t.project_name}
                  </Link>
                ) : (
                  t.project_name || "—"
                )}
              </Row>
              <Row label="Meeting">
                {t.meeting ? (
                  <Link
                    to={`/meetings/${t.meeting}`}
                    className="text-brand hover:underline"
                  >
                    {t.meeting_title}
                  </Link>
                ) : (
                  t.meeting_title || "—"
                )}
              </Row>
              <Row label="Assignee">{t.assignee_name}</Row>
              <Row label="Deadline">
                <span
                  className={t.is_overdue ? "font-medium text-red-600" : ""}
                >
                  {fmtDay(t.deadline)}
                </span>
              </Row>
              <Row label="Approved by">{t.approved_by_name}</Row>
              <Row label="Approved at">{fmtDateTime(t.approved_at)}</Row>
              <Row label="Created">{fmtDateTime(t.created_at)}</Row>
              <Row label="Completed">{fmtDateTime(t.completed_at)}</Row>
            </div>
          </Card>

          {isMgr && (
            <Card title="Edit task">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">
                    Assignee
                  </label>
                  <select
                    className={inputCls}
                    value={f.assignee}
                    onChange={(e) => setF({ ...f, assignee: e.target.value })}
                  >
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">
                    Deadline
                  </label>
                  <input
                    type="date"
                    className={inputCls}
                    value={f.deadline}
                    onChange={(e) => setF({ ...f, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">
                    Priority
                  </label>
                  <select
                    className={inputCls}
                    value={f.priority}
                    onChange={(e) => setF({ ...f, priority: e.target.value })}
                  >
                    {["HIGH", "MEDIUM", "LOW"].map((p) => (
                      <option key={p} value={p}>
                        {p[0] + p.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#1f5c99]"
                    checked={f.proof_required}
                    onChange={(e) =>
                      setF({ ...f, proof_required: e.target.checked })
                    }
                  />
                  <span>Require proof before this task can be closed</span>
                </label>
                <Btn
                  className="w-full"
                  disabled={busy}
                  onClick={() =>
                    patch(
                      {
                        assignee: Number(f.assignee),
                        deadline: f.deadline || null,
                        priority: f.priority,
                        proof_required: f.proof_required,
                      },
                      "Task updated.",
                    )
                  }
                >
                  Save changes
                </Btn>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
