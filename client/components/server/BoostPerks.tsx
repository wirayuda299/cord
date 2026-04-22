'use client'

import { Check, Lock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

// Wire to real server data when boost backend exists
const CURRENT_BOOSTS = 0

const LEVELS = [
  {
    level: 1,
    required: 2,
    perks: [
      { label: "150 Server Emojis", description: "Increase emoji slots from 50 to 150" },
      { label: "Animated Server Icon", description: "Add motion to your server's identity" },
      { label: "Custom Invite Splash", description: "Custom background on invite screens" },
      { label: "128kbps Audio Quality", description: "Higher bitrate for all voice channels" },
    ],
  },
  {
    level: 2,
    required: 7,
    perks: [
      { label: "250 Server Emojis", description: "Even more custom emojis for your community" },
      { label: "50 MB File Uploads", description: "Share larger files with members" },
      { label: "1080p / 60fps Streams", description: "Crystal-clear screen sharing and video" },
      { label: "Custom Role Icons", description: "Unique icon for each server role" },
    ],
  },
  {
    level: 3,
    required: 14,
    perks: [
      { label: "500 Server Emojis", description: "The ultimate emoji collection" },
      { label: "100 MB File Uploads", description: "Share even bigger files effortlessly" },
      { label: "Vanity URL", description: "A custom invite link for your server" },
      { label: "Animated Server Banner", description: "Animated banner at the top of your sidebar" },
    ],
  },
] as const

function getLevel(boosts: number) {
  if (boosts >= 14) return 3
  if (boosts >= 7) return 2
  if (boosts >= 2) return 1
  return 0
}

function getNextRequired(level: number) {
  return [2, 7, 14][level] ?? 14
}

export default function BoostPerks() {
  const level = getLevel(CURRENT_BOOSTS)
  const nextRequired = getNextRequired(level)
  const progress = level >= 3 ? 100 : Math.round((CURRENT_BOOSTS / nextRequired) * 100)

  return (
    <div className="overflow-y-auto max-h-screen w-full text-white">

      {/* Hero banner */}
      <div
        className="relative flex flex-col items-center justify-center gap-3 py-12"
        style={{ background: "linear-gradient(145deg, #2a0a4a 0%, #6c3483 50%, #9b59b6 100%)" }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #e91e8c 0%, transparent 50%), radial-gradient(circle at 80% 20%, #7b2fbe 0%, transparent 50%)" }} />

        <div className="relative flex items-center justify-center size-20 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm shadow-lg shadow-purple-900/40">
          <Zap className="size-10 fill-yellow-300 text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
        </div>

        <div className="relative text-center">
          <h2 className="font-bold text-3xl tracking-tight">Server Boost</h2>
          <p className="text-white/50 text-sm mt-1">Unlock perks for your whole community</p>
        </div>

        <div className="relative flex items-center gap-2 mt-1">
          {[1, 2, 3].map((lvl) => (
            <div
              key={lvl}
              className={cn(
                "flex items-center justify-center size-8 rounded-full text-xs font-bold border",
                level >= lvl
                  ? "border-purple-400 bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                  : "border-white/20 bg-white/5 text-white/30"
              )}
            >
              {lvl}
            </div>
          ))}
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-full px-3 py-1 text-xs font-semibold">
          <Zap className="size-3 fill-yellow-300 text-yellow-300" />
          Level {level}
        </div>
      </div>

      <div className="px-8 py-5 border-b border-white/5 bg-white/2">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm text-white/50">
            {level < 3
              ? `${CURRENT_BOOSTS} of ${nextRequired} boosts — Level ${level + 1}`
              : "Max level reached!"}
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-purple-300">
            <Zap className="size-3.5 fill-purple-300 text-purple-300" />
            {CURRENT_BOOSTS} Boosts
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #7b2fbe, #e91e8c)",
              boxShadow: progress > 0 ? "0 0 10px rgba(233,30,140,0.5)" : "none",
            }}
          />
        </div>
      </div>

      {/* Level sections */}
      <div className="px-8 py-6 flex flex-col gap-10">
        {LEVELS.map(({ level: lvl, required, perks }) => {
          const unlocked = level >= lvl
          return (
            <div key={lvl}>
              {/* Level header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    "flex items-center justify-center size-9 rounded-full text-sm font-bold border transition-all",
                    unlocked
                      ? "bg-purple-500 border-purple-400 text-white shadow-[0_0_14px_rgba(168,85,247,0.4)]"
                      : "bg-white/5 border-white/10 text-white/30"
                  )}
                >
                  {lvl}
                </div>
                <div className="flex-1">
                  <p className={cn("font-semibold text-sm leading-tight", !unlocked && "text-white/30")}>
                    Level {lvl}
                  </p>
                  <p className="text-xs text-white/30">{required} boosts required</p>
                </div>
                {unlocked ? (
                  <span className="text-xs bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full px-2.5 py-0.5 font-medium">
                    Unlocked
                  </span>
                ) : (
                  <span className="text-xs text-white/20 border border-white/10 rounded-full px-2.5 py-0.5">
                    Locked
                  </span>
                )}
              </div>

              {/* Perk list */}
              <div className="flex flex-col gap-1.5 pl-12">
                {perks.map((perk) => (
                  <div
                    key={perk.label}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      unlocked
                        ? "bg-white/5 hover:bg-white/8"
                        : "bg-white/2 opacity-40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center size-5 rounded-full shrink-0",
                        unlocked ? "bg-purple-500" : "bg-white/10"
                      )}
                    >
                      {unlocked
                        ? <Check size={10} className="text-white" strokeWidth={3} />
                        : <Lock size={9} className="text-white/40" />
                      }
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium leading-tight", !unlocked && "text-white/40")}>
                        {perk.label}
                      </p>
                      <p className="text-xs text-white/30 leading-tight mt-0.5">{perk.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="px-8 pb-10">
        <button
          className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #7b2fbe 0%, #e91e8c 100%)" }}
        >
          <Zap className="size-4 fill-white text-white" />
          Boost This Server
        </button>
        <p className="text-center text-xs text-white/25 mt-3">
          Boosts are tied to your account and can be moved at any time
        </p>
      </div>

    </div>
  )
}
