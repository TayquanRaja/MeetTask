import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api, errMsg } from "../api";
import AuthSplit, {
  authBtn,
  authInput,
  authLabel,
} from "../components/AuthSplit";

export default function ForgotPassword() {
  const [ident, setIdent] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!ident.trim()) {
      setErr("Enter your username or email.");
      return;
    }

    setBusy(true);
    try {
      await api.post("/auth/forgot-password/", {
        identifier: ident.trim(),
      });
      setSent(true);
    } catch (ex) {
      setErr(errMsg(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSplit
      eyebrow="Account recovery"
      title="Forgot password?"
      subtitle={
        sent
          ? null
          : "Enter your username or work email and we'll send you a link to reset your password."
      }
    >
      {sent ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
            <div className="font-semibold">Reset link sent</div>
            If an account matches those details, a reset link will be sent to
            its registered email address. Check your inbox and spam folder.
          </div>

          <Link
            to="/login"
            className="block text-center text-sm font-medium text-brand hover:underline"
          >
            ← Back to sign in
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
              <label className={authLabel}>Username or work email</label>
              <input
                className={authInput}
                value={ident}
                onChange={(e) => setIdent(e.target.value)}
                placeholder="name@company.com"
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <button type="submit" disabled={busy} className={authBtn}>
              {busy ? "Sending..." : "Send reset link"}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          <Link
            to="/login"
            className="mt-6 block text-center text-sm text-slate-500 hover:text-brand"
          >
            ← Back to sign in
          </Link>
        </>
      )}
    </AuthSplit>
  );
}
