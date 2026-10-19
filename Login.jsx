import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Lock, Mic, ShieldCheck } from "lucide-react";
import { errMsg } from "../api";
import { useAuth } from "../auth";
import { Logo } from "../components/Logo";
import {
  MeetingStage,
  PipelineSteps,
  Ripples,
  useStageClock,
} from "../components/Meetinganimation";

const STEPS = [
  [Mic, "Capture", "Private meeting record"],
  [ShieldCheck, "Review", "Manager approval"],
  [ArrowRight, "Deliver", "Accountable tasks"],
];

export default function Login() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useStageClock();

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (ex) {
      setErr(errMsg(ex));
    } finally {
      setBusy(false);
    }
  };

  const input =
    "h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

  return (
    <div className="grid min-h-screen lg:grid-cols-[46fr_54fr]">
      {/* Left brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-[440px] top-[6%] h-[900px] w-[900px] rounded-full bg-white/[0.025] ring-1 ring-white/5" />
        <div className="pointer-events-none absolute -right-[320px] top-[16%] h-[660px] w-[660px] rounded-full bg-white/[0.03] ring-1 ring-white/5" />
        <Ripples />

        <div className="lm-in relative">
          <Logo dark />
        </div>

        <div className="relative">
          <p
            className="lm-in font-mono text-xs uppercase tracking-[0.2em] text-slate-400"
            style={{ "--delay": "0.05s" }}
          >
            From discussion to delivery
          </p>
          <h1
            className="lm-in mt-5 font-semibold leading-[0.98] tracking-[-0.04em]"
            style={{
              fontSize: "clamp(2.75rem, 4.4vw, 5.25rem)",
              "--delay": "0.15s",
            }}
          >
            Clarity after
            <br />
            the conversation.
          </h1>
          <p
            className="lm-in mt-6 max-w-lg text-lg leading-8 text-slate-300"
            style={{ "--delay": "0.3s" }}
          >
            Decisions become real work only when a manager has reviewed them.
            Every action has a source, an owner, and a clear path forward.
          </p>

          {/* Live meeting animation: steps double as the stage selector */}
          <div className="lm-in mt-9" style={{ "--delay": "0.45s" }}>
            <PipelineSteps steps={STEPS} stage={stage} onSelect={setStage} />
            <MeetingStage stage={stage} className="mt-5 max-w-xl" />
          </div>
        </div>

        <div className="relative flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-slate-400">
          <ShieldCheck size={14} /> Private to your organization <span>·</span>{" "}
          Secure sign-in
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex items-center justify-center bg-[#f8f9fb] px-6 py-12">
        <div className="w-full max-w-[490px]">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <p
            className="lm-in font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500"
            style={{ "--delay": "0.1s" }}
          >
            Secure workspace access
          </p>
          <h2
            className="lm-in mt-3 text-4xl font-semibold tracking-tight text-navy-900"
            style={{ "--delay": "0.18s" }}
          >
            Welcome back
          </h2>
          <p
            className="lm-in mt-2 text-sm text-slate-500"
            style={{ "--delay": "0.26s" }}
          >
            Sign in with your organization account.
          </p>

          <form
            onSubmit={submit}
            className="lm-in mt-10 space-y-5"
            style={{ "--delay": "0.34s" }}
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Work email or username
              </label>
              <input
                className={input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="name@company.com"
                autoComplete="username"
                autoFocus
                required
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  className={`${input} pr-16`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-brand"
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {err && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}

            <button
              disabled={busy}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Signing in..." : "Sign in securely"}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          <div
            className="lm-in mt-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500"
            style={{ "--delay": "0.5s" }}
          >
            <Lock size={16} className="shrink-0 text-slate-400" />
            This workspace is invitation-only. Public registration is disabled.
          </div>
          <p
            className="lm-in mt-6 text-center text-xs text-slate-400"
            style={{ "--delay": "0.58s" }}
          >
            Need access? Contact your workspace administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
