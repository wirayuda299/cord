import Image from "next/image"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { Zap, Mic, Lock, Users, Hash, Video } from "lucide-react"

const FEATURES = [
  {
    icon: Zap,
    title: "Real-time messaging",
    desc: "Instant, low-latency chat across servers and DMs.",
  },
  {
    icon: Mic,
    title: "Crystal-clear voice",
    desc: "High-quality voice & video channels powered by LiveKit.",
  },
  {
    icon: Lock,
    title: "Roles & permissions",
    desc: "Fine-grained control over who can do what, per channel.",
  },
  {
    icon: Users,
    title: "Friends & DMs",
    desc: "Stay close with 1:1 conversations outside any server.",
  },
  {
    icon: Hash,
    title: "Organized channels",
    desc: "Text, voice, and categories to keep every topic tidy.",
  },
  {
    icon: Video,
    title: "Face to face",
    desc: "Jump into a video call without leaving the conversation.",
  },
]

export default async function Home() {
  const { userId } = await auth()

  return (
    <div className="relative min-h-svh w-full overflow-x-hidden overflow-y-auto bg-[#0d0e11]">
      <div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none z-0 blur-[100px]
          w-75 h-75 sm:w-150 sm:h-150 -top-25 -left-15 sm:-top-50 sm:-left-37.5
          bg-[radial-gradient(circle,rgba(88,101,242,0.25)_0%,transparent_70%)]
          animate-[blobFloat1_12s_ease-in-out_infinite_alternate]"
      />
      <div
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none z-0 blur-[100px]
          w-62.5 h-62.5 sm:w-125 sm:h-125 -bottom-12.5 -right-12.5 sm:-bottom-25 sm:-right-25
          bg-[radial-gradient(circle,rgba(124,58,237,0.2)_0%,transparent_70%)]
          animate-[blobFloat2_15s_ease-in-out_infinite_alternate]"
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

      <div className="relative z-10 flex flex-col min-h-svh">
        <header className="flex items-center justify-between px-4 sm:px-8 h-16 sm:h-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shrink-0 shadow-[0_0_0_1px_rgba(88,101,242,0.3),0_0_24px_rgba(88,101,242,0.25)]">
              <Image
                src="/cord-logo.png"
                alt="Cord logo"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-[-0.04em] bg-gradient-to-br from-white to-[#a5b4fc] bg-clip-text text-transparent">
              Cord
            </span>
          </div>

          <Link
            href={userId ? "/direct-messages" : "/sign-in"}
            className="px-3.5 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
          >
            {userId ? "Open Cord" : "Sign In"}
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-5 sm:py-16 text-center">
          <div
            aria-hidden="true"
            className="mb-6 sm:mb-8 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(88,101,242,0.08)] border border-[rgba(88,101,242,0.2)] animate-[pulseGlow_3s_ease-in-out_infinite]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#57f287]" />
            <span className="text-[11px] sm:text-xs text-[#949ba4]">
              Real-time chat, voice &amp; video
            </span>
          </div>

          <h1 className="text-[clamp(1.9rem,6vw,3.75rem)] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#f2f3f5] max-w-4xl">
            Where{" "}
            <span className="bg-linear-to-r from-[#818cf8] to-[#c084fc] bg-clip-text text-transparent">
              communities
            </span>
            <br className="hidden sm:block" /> come alive.
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-lg leading-relaxed text-[#949ba4] max-w-md sm:max-w-xl">
            Voice, video &amp; text — all in one lightning-fast platform built
            for the way you connect.
          </p>

          <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
            <Link
              href={userId ? "/direct-messages" : "/sign-in"}
              className="w-full sm:w-auto text-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-discord-brand hover:bg-accent-blue transition-colors shadow-[0_0_24px_rgba(88,101,242,0.35)]"
            >
              {userId ? "Open Cord" : "Get Started"}
            </Link>
            {userId && (
              <Link
                href="/browse"
                className="w-full sm:w-auto text-center px-6 py-3 rounded-xl text-sm font-semibold text-[#dbdee1] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                Discover Servers
              </Link>
            )}
          </div>

          <div className="mt-8  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full max-w-5xl text-left">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] transition-all duration-200 hover:bg-[rgba(88,101,242,0.08)] hover:border-[rgba(88,101,242,0.2)]"
              >
                <div className="flex items-center justify-center size-9 rounded-lg bg-discord-brand/15 shrink-0">
                  <f.icon size={17} className="text-[#818cf8]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#e0e2e7] mb-0.5">
                    {f.title}
                  </p>
                  <p className="text-xs sm:text-[13px] text-[#6d6f78] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className="shrink-0 px-4 sm:px-8 py-6 text-center text-[11px] sm:text-xs text-[#4e5058]">
          Built with Cord — a real-time chat platform.
        </footer>
      </div>
    </div>
  )
}
