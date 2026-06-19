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

### Implemented / Available
- **Authentication** — Clerk integrated on frontend and backend middleware (see [client/proxy.ts](client/proxy.ts) and [backend/internal/middleware/clerk_auth.go](backend/internal/middleware/clerk_auth.go)).
- **Server creation, joining, updating, deleting, and browsing** — full server lifecycle support.
- **Server profile management** — get/update server profile.
- **Server safety settings** — get/update safety settings.
- **Server moderation** — ban, unban, list banned members, and kick members.
- **Audit logs** — backend audit logging with Redis queue enqueue and worker-based persistence (see [backend/internal/services/servers/audit](backend/internal/services/servers/audit)).
- **Channels & categories** — channel creation, retrieval, and category listing.
- **Real-time messaging** — WebSocket hub and client hook implemented (see [backend/internal/websocket/hub.go](backend/internal/websocket/hub.go) and [client/hooks/useWebsocket.ts](client/hooks/useWebsocket.ts)).
- **Messages** — list, edit, delete, pin/unpin, reactions, and search.
- **Threads** — backend endpoints for creating threads and fetching thread messages.
- **Direct conversations** — create, list, find, and delete direct message conversations.
- **Friend requests** — send request, pending list, cancel, accept, and decline.
- **Roles & permissions** — role create/update/delete, assign/unassign roles, list role members, and permission lookup/check.
- **Invitations** — create/delete/find/join by invitation code.
- **Image upload/delete** — Cloudinary-backed image handling.
- **Member listing** — retrieve server members.
- **WebSocket route** — `/ws` endpoint for real-time events.

### Partially implemented / UI wiring
- **Threads UI** — backend fully supports threads; some client UX may still evolve.
- **Moderation UI flows** — backend endpoints exist; client-side experiences may still need polish.

### Not implemented / missing
- **Voice & video channels** — no backend or client support.
- **Audio/video calls** — no dedicated backend routes for live audio/video.
- **Live streaming** — not implemented.

### Notes
- The backend worker process (`backend/cmd/worker`) handles background jobs such as audit log persistence and queued operations.
- Use `go run ./cmd/api` to start the API and `go run ./cmd/worker` to start the worker.
- `backend/internal/middleware/clerk_auth.go` protects authorized endpoints.


