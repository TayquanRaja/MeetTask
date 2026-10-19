import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api, errMsg } from "../api";
import AuthSplit, {
  authBtn,
  authInput,
  authLabel,
} from "../components/AuthSplit";
import { PasswordChecklist, passwordError } from "../passwordRules";

export default function ResetPassword() {
  const { uid, token } = useParams();

  const [f, setF] = useState({
    next: "",
    confirm: "",
  });

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key) => (e) => {
    setF((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    const pe = passwordError(f.next);

    if (pe) {
      setErr(pe);
      return;
    }

    if (f.next !== f.confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      await api.post("/auth/reset-password/", {
        uid,
        token,
        new_password: f.next,
      });

      setDone(true);
    } catch (ex) {
      setErr(errMsg(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSplit
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle={done ? null : "Enter and confirm your new password."}
    >
      {done ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
            <div className="font-semibold">Password updated</div>
            You can now sign in using your new password.
          </div>

          <Link to="/login" className={authBtn}>
            Go to sign in
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={submit} className="space-y-5">
            {err && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}

            <div>
              <label className={authLabel}>New password</label>
              <input
                type="password"
                className={authInput}
                value={f.next}
                onChange={set("next")}
                autoComplete="new-password"
                required
                autoFocus
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

            <button type="submit" disabled={busy} className={authBtn}>
              {busy ? "Saving..." : "Reset password"}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          {err.toLowerCase().includes("expired") && (
            <Link
              to="/forgot-password"
              className="mt-6 block text-center text-sm font-medium text-brand hover:underline"
            >
              Request a new link
            </Link>
          )}
        </>
      )}
    </AuthSplit>
  );
}
