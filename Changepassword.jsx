import { useState } from "react";
import { ArrowRight, KeyRound, LogOut } from "lucide-react";
import { api, errMsg } from "../api";
import { useAuth } from "../auth";
import AuthShell, {
  authBtn,
  authInput,
  authLabel,
} from "../components/AuthShell";
import { PasswordChecklist, passwordError } from "../passwordRules";

export default function ChangePassword() {
  const { user, logout } = useAuth();
  const forced = !!user?.must_change_password;
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const pe = passwordError(f.next);
    if (pe) return setErr(pe);
    if (f.next !== f.confirm) return setErr("New passwords do not match.");
    if (f.next === f.current)
      return setErr("New password must be different from the current one.");
    setBusy(true);
    try {
      await api.post("/auth/change-password/", {
        current_password: f.current,
        new_password: f.next,
      });
      // Full reload so the user profile (and the must_change_password flag) is fetched again
      window.location.replace("/");
    } catch (ex) {
      setErr(errMsg(ex));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      icon={KeyRound}
      eyebrow="Account security"
      title={forced ? "Set your new password" : "Change password"}
      subtitle={
        forced
          ? "Choose a new password to finish signing in."
          : "Enter your current password and choose a new one."
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}
        <div>
          <label className={authLabel}>
            {forced ? "Password from your email" : "Current password"}
          </label>
          <input
            type="password"
            className={authInput}
            value={f.current}
            onChange={set("current")}
            autoComplete="current-password"
            required
            autoFocus
          />
        </div>
        <div>
          <label className={authLabel}>New password</label>
          <input
            type="password"
            className={authInput}
            value={f.next}
            onChange={set("next")}
            autoComplete="new-password"
            required
          />
          <PasswordChecklist value={f.next} />
        </div>
        <div>
          <label className={authLabel}>Confirm new password</label>
          <input
            type="password"
            className={authInput}
            value={f.confirm}
            onChange={set("confirm")}
            autoComplete="new-password"
            required
          />
        </div>
        <button disabled={busy} className={authBtn}>
          {busy ? "Saving..." : "Update password"}
          {!busy && <ArrowRight size={18} />}
        </button>
      </form>

      <button
        type="button"
        onClick={logout}
        className="mt-6 flex w-full items-center justify-center gap-2 text-sm text-slate-500 hover:text-brand"
      >
        <LogOut size={15} /> Log out
      </button>
    </AuthShell>
  );
}
