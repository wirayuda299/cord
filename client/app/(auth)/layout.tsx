import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In — Cord",
  description: "Sign in to Cord, your lightning-fast chat platform.",
}

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-time messaging",
    desc: "Instant, low-latency chat across servers and DMs.",
  },
  {
    icon: "🎙️",
    title: "Crystal-clear voice",
    desc: "High-quality voice channels powered by LiveKit.",
  },
  {
    icon: "🔒",
    title: "End-to-end encrypted",
    desc: "Your conversations stay private and secure.",
  },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-svh w-full flex items-stretch bg-[#0d0e11] overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none z-0 blur-[100px]
          w-[600px] h-[600px] -top-[200px] -left-[150px]
          bg-[radial-gradient(circle,rgba(88,101,242,0.25)_0%,transparent_70%)]
          animate-[blobFloat1_12s_ease-in-out_infinite_alternate]"
      />
      <div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none z-0 blur-[100px]
          w-[500px] h-[500px] -bottom-[100px] -right-[100px]
          bg-[radial-gradient(circle,rgba(124,58,237,0.2)_0%,transparent_70%)]
          animate-[blobFloat2_15s_ease-in-out_infinite_alternate]"
      />
      <div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none z-0 blur-[100px]
          w-[300px] h-[300px] top-[40%] left-[40%]
          bg-[radial-gradient(circle,rgba(6,182,212,0.15)_0%,transparent_70%)]
          animate-[blobFloat3_10s_ease-in-out_infinite_alternate]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(88,101,242,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(88,101,242,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex w-full min-h-svh">
        <aside
          aria-label="Cord brand panel"
          className="hidden lg:flex flex-col justify-center gap-6
            px-12 py-8 w-1/2 max-w-[640px] h-svh overflow-y-auto
            border-r border-[rgba(88,101,242,0.12)]
            bg-[linear-gradient(145deg,rgba(88,101,242,0.06)_0%,rgba(124,58,237,0.04)_50%,transparent_100%)]
            backdrop-blur-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-[52px] h-[52px] rounded-2xl overflow-hidden shrink-0 shadow-[0_0_0_1px_rgba(88,101,242,0.3),0_0_32px_rgba(88,101,242,0.25)]">
              <Image
                src="/cord-logo.png"
                alt="Cord logo"
                width={52}
                height={52}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="text-[1.75rem] font-extrabold tracking-[-0.04em] bg-gradient-to-br from-white to-[#a5b4fc] bg-clip-text text-transparent">
              Cord
            </span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-[clamp(1.6rem,2.8vw,2.2rem)] font-extrabold leading-[1.15] tracking-[-0.04em] text-[#f2f3f5] mb-2.5">
              Where{" "}
              <span className="bg-gradient-to-r from-[#818cf8] to-[#c084fc] bg-clip-text text-transparent">
                communities
              </span>
              <br />
              come alive.
            </h1>
            <p className="text-base leading-[1.65] text-[#949ba4] max-w-[42ch]">
              Voice, video &amp; text — all in one lightning-fast platform built
              for the way you connect.
            </p>
          </div>

          {/* Features */}
          <ul aria-label="Key features" className="list-none p-0 flex flex-col gap-4">
            {FEATURES.map((f) => (
              <li
                key={f.title}
                className="flex items-start gap-3 p-3 px-4 rounded-xl
                  bg-white/[0.03] border border-white/[0.06]
                  transition-all duration-200
                  hover:bg-[rgba(88,101,242,0.08)] hover:border-[rgba(88,101,242,0.2)] hover:translate-x-1"
              >
                <span aria-hidden="true" className="text-[1.35rem] leading-none shrink-0 mt-0.5">
                  {f.icon}
                </span>
                <div>
                  <p className="text-[0.9rem] font-semibold text-[#e0e2e7] mb-0.5">{f.title}</p>
                  <p className="text-[0.82rem] text-[#6d6f78]">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Community pill */}
          <div
            aria-hidden="true"
            className="flex items-center gap-2.5 px-5 py-3.5 rounded-full w-fit
              bg-[rgba(88,101,242,0.08)] border border-[rgba(88,101,242,0.2)]
              animate-[pulseGlow_3s_ease-in-out_infinite]"
          >
            {/* Stacked avatars */}
            {[
              { label: "W", className: "bg-gradient-to-br from-[#5865f2] to-[#7c3aed]" },
              { label: "A", className: "bg-gradient-to-br from-[#ec4899] to-[#ef4444]" },
              { label: "J", className: "bg-gradient-to-br from-[#06b6d4] to-[#3b82f6]" },
            ].map((av, i) => (
              <div
                key={av.label}
                className={`w-7 h-7 rounded-full flex items-center justify-center
                  text-[0.7rem] font-bold text-white shrink-0
                  border-2 border-[#0d0e11] ${i !== 0 ? "-ml-1.5" : ""} ${av.className}`}
              >
                {av.label}
              </div>
            ))}
            <div className="w-7 h-7 -ml-1.5 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-[#949ba4] shrink-0 border-2 border-[#0d0e11] bg-white/10">
              +24
            </div>
            <span className="text-[0.8rem] text-[#949ba4] ml-1 whitespace-nowrap">
              Join 500+ communities today
            </span>
          </div>
        </aside>

        {/* ── RIGHT PANEL ── */}
        <main
          id="main-content"
          className="flex-1 flex items-center justify-center px-6 min-h-svh"
        >
          <div className="clerk-wrapper w-full max-w-max flex flex-col items-center">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
