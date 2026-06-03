# cord

Discord clone built with Next.js and Go.

## Stack

- **Frontend** — Next.js 16, Tailwind CSS, Zustand, SWR, React Hook Form, Zod
- **Backend** — Go, WebSocket
- **Storage** — Cloudinary (image/file uploads)

## Getting Started

```bash
# Frontend
cd client
pnpm install
pnpm dev

# Backend
cd server
go run main.go
```

## Features (current status)

### Implemented / Available
- **Authentication** — Clerk is integrated on frontend and backend middleware (see [client/proxy.ts](client/proxy.ts) and [backend/internal/middleware/clerk_auth.go](backend/internal/middleware/clerk_auth.go)).
- **Server creation & joining** — server services & routes exist (see [backend/internal/services/servers](backend/internal/services/servers)).
- **Channel & category management** — handlers and services present (see [backend/internal/handlers/channels.go](backend/internal/handlers/channels.go) and [backend/internal/services/categories](backend/internal/services/categories)).
- **Real-time messaging (WebSocket)** — hub and client hook implemented (see [backend/internal/websocket/hub.go](backend/internal/websocket/hub.go) and [client/hooks/useWebsocket.ts](client/hooks/useWebsocket.ts)).
- **Message send / delete / pin / reactions** — server handlers and client APIs exist (see [backend/internal/handlers/messages.go](backend/internal/handlers/messages.go) and [client/lib/client/api/messages.ts](client/lib/client/api/messages.ts)).
- **Message editing (5-minute window)** — enforced server-side and supported client-side; edits are broadcast to the channel and clients merge updates (see [backend/internal/services/messages/edit.go](backend/internal/services/messages/edit.go) and [client/components/chat/ChatList.tsx](client/components/chat/ChatList.tsx)).
- **File/image attachments (Cloudinary)** — image upload flows and image service exist (see [backend/internal/services/images](backend/internal/services/images) and Cloudinary config in client).
- **Threads** — backend endpoints for creating threads and fetching thread messages exist (see [backend/internal/handlers/threads.go](backend/internal/handlers/threads.go)) and client has UI components for threads.
- **Roles & permissions** — services and handlers present (see [backend/internal/services/roles](backend/internal/services/roles) and [backend/internal/services/permissions](backend/internal/services/permissions)).
- **Invites / invitation codes** — implemented (see [backend/internal/handlers/invitations.go](backend/internal/handlers/invitations.go)).
- **Members listing** — member retrieval exists (see [backend/internal/services/members/find-all.go](backend/internal/services/members/find-all.go)).
- **Direct messages (conversations)** — conversation handlers and client flows exist (see [backend/internal/handlers/conversations.go](backend/internal/handlers/conversations.go)).
- **Friend requests** — handlers/services present (see [backend/internal/handlers/friends.go](backend/internal/handlers/friends.go)).

### Partially implemented / UI wiring
- **Threads UI** — backend fully supports threads; some client UX may be partial (thread navigation and creation present, reply UX differs between main channel and thread view).

### Not Implemented / Missing
- **Voice & video channels** — no backend or client support.
- **Member moderation (ban/kick/timeout)** — no dedicated endpoints for moderation actions.
- **Audit logs (server-side)** — client has an AuditLog UI shell, but backend audit storage/endpoints are not present.
- **Global search / message search** — basic user/name lookups exist, but a full-text message search endpoint is not implemented.

### Notes & constraints
- Message edits are allowed only within a 5-minute window and only by the original author — enforced server-side ([backend/internal/services/messages/edit.go](backend/internal/services/messages/edit.go)).
- After recent changes, edited messages are broadcast via WebSocket and clients merge incoming updates so other users see edits in real time.


