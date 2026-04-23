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


- TODO:
● Skenario yang terjadi:

  1. User attach gambar → upload mulai ke Cloudinary (proses ini butuh beberapa detik)
  2. Sebelum upload selesai, user langsung reload/tutup halaman
  3. Upload tetap jalan di server Cloudinary sampai selesai — tapi browser sudah mati duluan
  4. Client tidak pernah dapat response (tidak tahu public_id-nya apa)
  5. Gambar sudah tersimpan di Cloudinary, tapi kita tidak bisa delete karena tidak tahu ID-nya

  Ini beda dengan skenario yang sudah ditangani:
  - Upload sudah selesai (client dapat public_id) → baru user reload → beforeunload bisa delete pakai ID yang sudah ada

  Untuk skenario yang belum ditangani, solusinya hanya di backend: setiap X menit, cek Cloudinary assets yang tidak punya pasangan di
  database messages, lalu delete. Ini namanya orphan cleanup job.

  Tapi untuk project ini, itu sangat jarang terjadi (harus reload tepat saat upload berlangsung) dan storage waste-nya kecil. Bisa
  diabaikan dulu.
