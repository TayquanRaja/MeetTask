import { ShieldCheck } from "lucide-react";
import { Logo } from "./Logo";
import { Ripples } from "./Meetinganimation";

// Shared look for the standalone auth pages (change / forgot / reset password), matching the sign-in page
export const authInput =
  "h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export const authBtn =
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60";

export const authLabel = "mb-2 block text-sm font-medium text-slate-700";

export default function AuthShell({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  children,
}) {
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
              fontSize: "clamp(2.5rem, 4vw, 4.5rem)",
              "--delay": "0.15s",
            }}
          >
            Clarity after
            <br />
            the conversation.
          </h1>
          <p
            className="lm-in mt-6 max-w-md text-lg leading-8 text-slate-300"
            style={{ "--delay": "0.3s" }}
          >
            Decisions become real work only when a manager has reviewed them.
            Every action has a source, an owner, and a clear path forward.
          </p>
        </div>

        <div className="relative flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-slate-400">
          <ShieldCheck size={14} /> Private to your organization <span>·</span>{" "}
          Secure sign-in
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex items-center justify-center bg-[#f8f9fb] px-6 py-12">
        <div className="w-full max-w-[460px]">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <span className="lm-in grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
            <Icon size={22} />
          </span>
          <p
            className="lm-in mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500"
            style={{ "--delay": "0.08s" }}
          >
            {eyebrow}
          </p>
          <h2
            className="lm-in mt-3 text-4xl font-semibold tracking-tight text-navy-900"
            style={{ "--delay": "0.16s" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="lm-in mt-2 text-sm text-slate-500"
              style={{ "--delay": "0.24s" }}
            >
              {subtitle}
            </p>
          )}
          <div className="lm-in mt-8" style={{ "--delay": "0.32s" }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
