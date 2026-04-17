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

## Features

### Implemented
- Server creation, joining by invite code
- Channel & category creation
- Real-time messaging via WebSocket
- Message deletion, pinning, replies
- File/image attachments (Cloudinary)
- Role & permission management
- Invite code generation and deletion
- Member list with online/offline status
- Server settings (name, icon)

### Not Yet Implemented
- Authentication (sign-in / sign-up)
- Direct messages
- Message editing
- Emoji reactions
- Member moderation (ban, kick, timeout)
- Audit logs
- Search
- Voice / video channels
- Threads
- Friend list
