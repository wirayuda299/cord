# cord

Discord clone built with Next.js, Go, PostgreSQL, Redis, and Cloudinary.

## Stack

- **Frontend** — Next.js 16, Tailwind CSS, Zustand, SWR, React Hook Form, Zod
- **Backend** — Go, Gorilla Mux, WebSocket, Redis queue
- **Storage** — PostgreSQL, Redis, Cloudinary

## Getting Started

```bash
# Frontend
cd client
pnpm install
pnpm dev

# Backend API
cd backend
go run ./cmd/api

# Worker (background jobs)
cd backend
go run ./cmd/worker
```

## Features (current status)

Audited directly against the code (both client UI wiring and backend
routes/handlers), not from memory — last checked 2026-08-29.

### Finished
- **Authentication** — Clerk on both sides; Next.js middleware
  ([client/proxy.ts](client/proxy.ts)) and Go middleware
  ([backend/internal/middleware/clerk_auth.go](backend/internal/middleware/clerk_auth.go)).
- **Servers** — create, join (by invite code), browse public servers,
  update profile (name/icon/banner/description/privacy), delete
  (type-name-to-confirm), leave.
- **Channels** — create (text/audio/forum type), list grouped by
  category, edit name (gear icon on hover, per channel).
- **Categories** — create, list. *(No edit/delete UI — see below.)*
- **Real-time chat** — WebSocket hub
  ([backend/internal/websocket/hub.go](backend/internal/websocket/hub.go)) +
  client hook ([client/hooks/useWebsocket.ts](client/hooks/useWebsocket.ts));
  live typing users, presence in the chat member list, live message
  broadcast.
- **Messages** — send (text + one image attachment), edit, delete,
  reply/thread, pin/unpin, emoji reactions, emoji picker, full-text
  search within a channel.
- **Threads** — create from a message, dedicated thread view, real-time
  updates.
- **Direct messages** — 1:1 conversations with real-time chat, reusing
  the same chat UI as server channels.
- **Friends** — send/cancel/accept/decline friend requests, pending
  list, all-friends list, invite-a-friend-to-server dialog.
- **Roles & permissions** — create/edit/delete roles, assign/unassign
  members, per-permission checks gating almost every UI action
  server-side and client-side.
- **Server moderation** — ban (with reason, confirm dialog), unban
  (confirm dialog), ban list with search, audit log (filterable,
  real backend-persisted events via a Redis queue + worker).
- **Server safety settings** — get/update verification level, content
  filter, default notifications.
- **Invitations** — create, list, delete, join-by-code.
- **Voice/video channels** — LiveKit-backed calls, with a server
  membership check on token minting (fixed during a security audit
  earlier in this branch's history).
- **Image upload/delete** — Cloudinary-backed, used for avatars,
  server icons/banners, and chat attachments.

### Partially implemented / has known gaps
- **Kick member** — works, but fires immediately on click with no
  confirmation dialog, unlike ban/unban which both confirm first.
  Inconsistent, easy to mis-click.
- **Member presence** — real in the chat sidebar's member list (driven
  by the websocket's online-users set); **hardcoded to always show
  "online"** in the server settings → Members management tab
  (`components/server/Members.tsx`'s `MemberAvatar` always passes
  `indicator="online"` — not wired to real presence there).
- **Channel management** — create and rename only. No UI to delete a
  channel or move it between categories, and no way to change a
  channel's type after creation — even though the backend supports
  channel deletion (`DELETE /channel`) and the edit dialog explicitly
  can't touch type because the backend update endpoint doesn't accept
  one (only name/topic/category_id, and topic isn't exposed in the UI
  either).
- **Category management** — create-only. Backend has update and delete
  endpoints (`backend/internal/services/categories/{update,delete}.go`)
  with no client action or UI calling either.

### Not implemented (UI exists, but it's a static mock)
- **Notifications** (`components/server/Notification.tsx`) — the bell
  icon opens a dropdown, but it renders 10 hardcoded placeholder rows
  ("Sender name" / "message" / "12:00 PM") from
  `Array.from({ length: 10 })`. No backend notification system exists
  at all — nothing generates, stores, or fetches real notifications.
- **Server Boost** (`components/server/BoostPerks.tsx`) — full UI
  (progress bar, perk tiers, boost count) driven entirely by a
  hardcoded `const CURRENT_BOOSTS = 0`. No backend boost/subscription
  system exists — there's nothing to actually boost with.

### Not implemented at all
- **Live streaming** — no backend or client support.

### Notes
- `backend/cmd/worker` handles background jobs — audit log
  persistence, queued operations.
- `go run ./cmd/api` starts the API, `go run ./cmd/worker` starts the
  worker.
- `backend/internal/middleware/clerk_auth.go` protects authenticated
  routes.
