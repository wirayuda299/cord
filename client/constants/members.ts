export type MemberRole = "owner" | "mod" | "bot" | null;
export type MemberStatus = "online" | "idle" | "dnd" | "offline";

export type Member = {
   id: number;
   name: string;
   initials: string;
   status: MemberStatus;
   activity: string | null;
   role: MemberRole;
   color: string;
};

export const MEMBERS: Member[] = [
   { id: 1, name: "alexknight", initials: "AK", status: "online", activity: "Playing Valorant", role: "owner", color: "bg-indigo-500/20 text-indigo-400" },
   { id: 2, name: "sakura_r", initials: "SR", status: "online", activity: "Listening to Spotify", role: "mod", color: "bg-yellow-500/20 text-yellow-400" },
   { id: 3, name: "Midori Bot", initials: "B", status: "online", activity: null, role: "bot", color: "bg-green-500/20 text-green-400" },
   { id: 4, name: "jdawg99", initials: "JD", status: "dnd", activity: "Do Not Disturb", role: null, color: "bg-red-500/20 text-red-400" },
   { id: 5, name: "nova_dev", initials: "NV", status: "idle", activity: "Idle", role: null, color: "bg-purple-500/20 text-purple-400" },
   { id: 6, name: "taka", initials: "TK", status: "online", activity: "Writing code...", role: null, color: "bg-cyan-500/20 text-cyan-400" },
   { id: 7, name: "mj_creative", initials: "MJ", status: "offline", activity: null, role: null, color: "bg-zinc-500/20 text-zinc-500" },
   { id: 8, name: "pixelwolf", initials: "PX", status: "offline", activity: null, role: null, color: "bg-zinc-500/20 text-zinc-500" },
   { id: 9, name: "r_luna", initials: "RL", status: "offline", activity: null, role: null, color: "bg-zinc-500/20 text-zinc-500" },
   { id: 10, name: "zephyrx", initials: "ZX", status: "offline", activity: null, role: null, color: "bg-zinc-500/20 text-zinc-500" },
   { id: 11, name: "frost_byte", initials: "FB", status: "online", activity: "Playing Minecraft", role: "mod", color: "bg-sky-500/20 text-sky-400" },
   { id: 12, name: "echowave", initials: "EW", status: "online", activity: "Watching Netflix", role: null, color: "bg-pink-500/20 text-pink-400" },
   { id: 13, name: "Atlas Bot", initials: "AB", status: "online", activity: null, role: "bot", color: "bg-green-500/20 text-green-400" },
   { id: 14, name: "draven_x", initials: "DX", status: "dnd", activity: "Do Not Disturb", role: null, color: "bg-orange-500/20 text-orange-400" },
   { id: 15, name: "lunaris", initials: "LN", status: "idle", activity: "Idle", role: null, color: "bg-violet-500/20 text-violet-400" },
   { id: 16, name: "kai_storm", initials: "KS", status: "online", activity: "Playing CS2", role: null, color: "bg-rose-500/20 text-rose-400" },
   { id: 17, name: "byte_me", initials: "BM", status: "online", activity: "Listening to Spotify", role: null, color: "bg-teal-500/20 text-teal-400" },
   { id: 18, name: "velox", initials: "VX", status: "idle", activity: "Idle", role: null, color: "bg-amber-500/20 text-amber-400" },
   { id: 19, name: "neon_ghost", initials: "NG", status: "dnd", activity: "Do Not Disturb", role: null, color: "bg-fuchsia-500/20 text-fuchsia-400" },
   { id: 20, name: "starluxe", initials: "SL", status: "online", activity: "Streaming", role: null, color: "bg-lime-500/20 text-lime-400" },
   { id: 21, name: "riptide99", initials: "RT", status: "offline", activity: null, role: null, color: "bg-zinc-500/20 text-zinc-500" },
   { id: 22, name: "cipher_k", initials: "CK", status: "offline", activity: null, role: null, color: "bg-zinc-500/20 text-zinc-500" },
   { id: 23, name: "wraithmode", initials: "WM", status: "offline", activity: null, role: null, color: "bg-zinc-500/20 text-zinc-500" },
   { id: 24, name: "solaris_7", initials: "S7", status: "offline", activity: null, role: null, color: "bg-zinc-500/20 text-zinc-500" },
   { id: 25, name: "ironclad", initials: "IC", status: "offline", activity: null, role: null, color: "bg-zinc-500/20 text-zinc-500" },
];

export const STATUS_DOT: Record<MemberStatus, string> = {
   online: "bg-green-500",
   idle: "bg-yellow-500",
   dnd: "bg-red-500",
   offline: "bg-zinc-500",
};

export const ROLE_BADGE: Record<NonNullable<MemberRole>, string> = {
   owner: "bg-yellow-500/20 text-yellow-400",
   mod: "bg-indigo-500/20 text-indigo-400",
   bot: "bg-green-500/20 text-green-400",
};

export function getOnlineMembers(members: Member[]): Member[] {
   return members.filter((m) => m.status !== "offline");
}

export function getOfflineMembers(members: Member[]): Member[] {
   return members.filter((m) => m.status === "offline");
}
