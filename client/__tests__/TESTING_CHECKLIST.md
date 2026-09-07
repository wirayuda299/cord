# Unit Test Checklist

Per-function, not per-file, across every layer surveyed so far (server actions, pure utils, hooks, client API). Only **Full** and **Smoke** items are listed — actual test targets. **Skip** items (pure boilerplate, identical shape to an already-covered sibling) are omitted entirely; each section just notes what's excluded so the list stays actionable.

- **Full** — real branching, unique side effect, or a confirmed bug. Write the full scenario suite.
- **Smoke** — same skeleton as a sibling already covered. One happy-path test to pin signature/endpoint/tag, skip the rest.

---

## 1. Server Actions — `lib/actions/*.ts`

**Status: done.** 51 tests across 10 files in `__tests__/actions/`.

| File               | Full                                       | Smoke                                  |
| ------------------ | ------------------------------------------ | -------------------------------------- |
| `audit.ts`         | `getAuditLogs`                             |                                        |
| `categories.ts`    | `createCategory`                           |                                        |
| `channels.ts`      | `createChannel`                            | `updateChannel`                        |
| `conversations.ts` | `startConversation`                        |                                        |
| `servers.ts`       | `updateServer`, `banMember`                | `joinServer`                           |
| `role.ts`          | `createRole`                               | `updateRole`                           |
| `images.ts`        | `uploadImage`                              | `deleteImage`                          |
| `messages.ts`      | `pinMessage`, `createThread`               | `deletePinnedMessage`, `deleteMessage` |
| `invitations.ts`   | `createInvitationCode`, `joinServerByCode` |                                        |

Excluded (Skip, boilerplate): `createServer`, `kickMember`, `unbanMember`, `deleteServer`, `updateSafetySetup` in `servers.ts`; every function in `serverProfile.ts`, `members.ts`, `friends.ts`, `threads.ts`.

Fixed bugs found along the way: `banMember` no longer rethrows / returns `{error}` — normalized to `{message,success}` like every sibling (caller `Members.tsx` updated to match).

---

## 2. Pure Utils — `lib/*.ts`

- [x] `lib/file-validation.ts` → `validateFiles` — **Full** (done, `__tests__/file-validation.test.ts`). Pure function, real branches (max-count guard, type check, size check), no mocking needed.
- [x] `lib/clipboard.ts` → `copyText` — **Full** (todo). Branches: `navigator.clipboard` missing → `onError`; write succeeds → `onSuccess`, returns `true`; write throws → `onError`, returns `false`. Needs mocking `navigator.clipboard.writeText`.

Excluded (Skip): `lib/utils.ts` (`cn`, one-line `clsx`/`twMerge` wrapper), `lib/validations/*.ts` (pure declarative zod schemas, no `.refine`/`.transform`), `lib/zustand-ssr.ts` (SSR-hydration boilerplate), `lib/env.ts` (two one-line `process.env` reads with a fallback, nothing to branch on).

---

## 3. Hooks — `hooks/*.ts`

- [x] `hooks/useToggleRole.ts` → `useToggleRoleMember` — **Full** (done, `__tests__/useToggleRole.test.ts`). Real state-machine logic (`isOwner` guard, in-flight guard via `pendingRoleId`, toggle-same-role vs swap-role branches, error handling). The "same owner" test now actually invokes `handleToggleRole` inside `act` before asserting nothing fired — verified by temporarily removing the `isOwner` guard and confirming the test fails.
- [x] `hooks/useAttachedFiles.ts` — **Full, but higher setup cost** (todo). Real logic (slice to `MAX_FILES`, revoke object URLs on unmount/remove/clear, drag/paste file parsing) but leans on DOM APIs (`crypto.randomUUID`, `URL.createObjectURL`, synthetic drag/paste events) — needs `renderHook` + mocking those globals.
- [x] `hooks/useWebsocket.ts` → `useWebSocket` — **Full, high value but high cost** (todo). Real logic: reconnect/cleanup on `[serverId, channelId, userId]` change, multi-line JSON message parsing with per-line try/catch, message routing by `type` (`message_deleted` vs generic event vs plain message), `sendMessage` guard on `readyState`. Needs a fake `WebSocket` class (jsdom doesn't reliably provide a usable one) — significant mock harness before any assertion. Recommend deferring until the other items are done.

No Skip candidates in this layer — every hook has real logic.

---

## 4. Client API — `lib/api/*.ts` + `lib/fetcher.ts`

Different pattern than server actions: these **throw** on failure (`throw new Error(...)`) instead of returning `{message,success}`. Two shared skeletons — one representative gets **Full**, functions with their own extra branch get **Smoke**, identical-shape siblings are excluded.

**A. Read pattern — `apiFetcher<T>` (`lib/fetcher.ts`)**
Single shared helper behind almost every read-only `lib/api/*` function: builds request, checks `!res.ok || !payload.success`, throws with `payload.message` fallback, otherwise returns `payload.data`.

- [x] `apiFetcher` — **Full** (todo). Success, `res.ok` false, `payload.success` false, malformed JSON (`.catch(() => ({success:false,...}))`).
- [x] `permissions.ts` → `findPermissionByRoleId` — **Smoke**. Has its own branch on top of `apiFetcher` (`data && data.length > 0 ? data[0] : null`) — one test for the empty-array case.
- [x] `users.ts` → `findUsersByName` — **Smoke**. Only one with its own validation branch (`!username` → throw) before calling `apiFetcher`.

Excluded (Skip, one-line `apiFetcher` calls fully proven by `apiFetcher`'s own tests): `roles.ts` (`getAllRoles`, `getAllMemberByRole`), `friends.ts` (`getAllPendingRequest`), `permissions.ts` (`hasPermission`), `bans.ts`, `invitation.ts` (`getAllInvitation`), `serverProfile.ts`, `threads.ts`, `server.ts`.

**B. Mutation pattern — raw `fetch` + `if (!res.ok) throw` (no shared helper)**

- [x] `roles.ts` → `assignRole` — **Full** (done). Representative of this skeleton; also the one `useToggleRole.test.ts` currently mocks instead of testing directly — worth a real test of its own behavior.
- [x] `roles.ts` → `unassignRole` — **Smoke** (done, `__tests__/unassignRole.test.ts`). Identical shape to `assignRole`, kept as Smoke since it's the other half of the assign/unassign pair used together in `useToggleRole`.
- [x] `friends.ts` → `cancelFriendRequest` — **Smoke** (done, `__tests__/cancelFriendRequest.test.ts`). Same shape as `assignRole`.
- [x] `messages.ts` (api) → `editMessage` — **Full** (done, `__tests__/editMessage.test.ts`). **Found and fixed a real bug**: the error path did `.catch(() => null)`, not `.catch(() => ({}))` like its siblings — a non-JSON error body made `data.message` crash with a `TypeError` instead of falling back to "Failed to edit message". Fixed in `lib/api/messages.ts`, with a regression test pinning it.

Excluded (Skip, identical shape to a covered sibling): `roles.ts` → `deleteRole` (fixed: removed the stray `console.log(await res.json())` at ~line 64, no test needed — pure cleanup), `friends.ts` → `acceptFriendRequest`/`declineFriendRequest`, `invitation.ts` → `deleteInvitationCode`, `messages.ts` (api) → `addReaction`/`removeReaction`, `messages.ts` (api) → `searchMessage` (has a no-op `try{...}catch(e){throw e}` — style nit only).

- [x] `safety_rules.ts` → `getSafetySetup` — **Full** (done, `__tests__/safetySetup.test.ts`). Triaged: caller (`SafetySetup.tsx`) already destructures `{ error, data }` matching the return shape exactly — no fix needed, unlike `banMember`. Tested as-is: success, `!res.ok`, and network-error-propagates-uncaught branches.

---

## Suite templates

**Server-action style (`{message,success}`, no React):**

```ts
vi.mock("@clerk/nextjs/server", () => ({ auth: { protect: vi.fn() } }));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), refresh: vi.fn() }));
```

**Client-API style (throws, uses `@clerk/nextjs`'s `getToken` directly, not `auth.protect`):**

```ts
vi.mock("@clerk/nextjs", () => ({ getToken: vi.fn() }));
// assert with .rejects.toThrow("...") instead of .resolves.toMatchObject(...)
```

**Hook style (needs jsdom + `@testing-library/react`):**

```ts
import { renderHook, act } from "@testing-library/react";
// wrap any call that triggers a state update in `await act(async () => { ... })`
```

---

## 5. Server Queries — `lib/queries/*.ts`

Server-only RSC data-fetchers (`import "server-only"`). Same skeleton as the client API's mutation pattern (`auth()` → `getToken` → `fetch` → branch → return/throw), but server-side, using `auth()` not `auth.protect()`, and some wrapped in React's `cache()` for per-request memoization.

- [x] `channel_detail.ts` → `getChannelById` — **Full** (done, `__tests__/queries/getChannelById.test.ts`). Covers the `!userId` throw, the `!res.ok` → `{error}` (not throw — left as-is, just a documented inconsistency, not fixed) branch, success, and network-error-propagates. **Cache gotcha sidestepped**: rather than `vi.resetModules()` + dynamic import (which also resets the `@clerk/nextjs/server` mock factory, invalidating the statically-imported `auth` reference), each test just uses its own unique channel id so `cache()`'s per-argument memoization can't leak a stale result between tests.
- [x] `permissions.ts` (query) → `hasPermission` — **Smoke** (done, `__tests__/queries/hasPermission.test.ts`). Has its own `payload.success` check on top of `!res.ok` — covered both branches plus malformed-JSON fallback. Needed `vi.mock("server-only", () => ({}))` since the real package throws when imported outside a Server Component.

Excluded (Skip, identical `auth()→fetch→!res.ok→throw` shape): `servers.ts` (`getAllServers`, `browseServers`), `messages.ts` (`getAllMessagesByChannelId`, `getAllPinnedMessages`), `conversations.ts` (`getAllConversations`, `getConversationById`), `friends.ts` (`getAllFriends`), `invitations.ts` (`findInvitationByCode`), `channels.ts` (`getAllChannel`), `members.ts` (`isUserJoin`, `getAllMembersInServer`), `threads.ts` (`getAllThreadMessages`).

---

## 6. Zustand Store — `stores/store.ts`

- [x] `useAppStore` → `addOnlineUser`, `removeOnlineUser` — **Full** (done, `__tests__/store.test.ts`). Real dedup logic: `addOnlineUser` returns the _same_ state object (no-op) if the id is already in the set, `removeOnlineUser` does the same if the id isn't present — this matters for avoiding unnecessary re-renders. Note: zustand's default `set` always produces a new top-level state object via `Object.assign`, so the "same object" check has to compare the `onlineUserIds` Set reference specifically, not `getState()` as a whole.

Excluded (Skip, trivial one-line `set({...})` calls, no branching): `setSelectedMsg`, `toggleMemberPanel`, `setSelectedCategory`, `setSidebarOpen`, `setChannelSidebarOpen`, `setOnlineUserIds`.

---

## Out of scope for this checklist

- `components/**/*.tsx` and `app/**/*.tsx` — UI/JSX, no standalone pure-logic files found alongside them. These need component/integration testing (`@testing-library/react` render + interaction), a different approach than the unit tests here — not listed in this checklist.
- `constants/*.ts` — static data/enums, no logic.
- `types/*.ts` — type-only, nothing to execute.

---

## 7. API Routes & Middleware — `app/api/*/route.ts`, `proxy.ts`

Missed in the first survey pass — these are arguably the highest-value target in the codebase: webhook signature verification and video-room authorization are security-critical, not just correctness-critical.

- [x] `proxy.ts` → `isPublicRoute` — **Full** (done, `__tests__/proxy.test.ts`). Was a private function — exported it so it's directly testable. Test each branch: `/`, `/sign-in*`, `/sign-up*`, `/api/webhook*` → public; anything else → not public (plus a documented edge case: `/sign-in-not-really` is also public since the match is `startsWith`, not exact/prefix-boundary). This gates whether `auth.protect()` runs at all, so a typo here silently exposes or blocks a whole route tree.
- [x] `app/api/webhook/route.ts` → `POST` — **Full** (done, `__tests__/api/webhook.test.ts`). Covers: missing `CLERK_WEBHOOK_SIGNING_SECRET` → 500; missing svix header → 400; `wh.verify()` throws → 400; `user.created` → forwards to backend (success → 201, backend `!res.ok` → 500, backend fetch throws → 500); other event type → 200 no-op. `Webhook` mocked via `vi.mock("svix", ...)` — **gotcha**: the mock constructor must be a real `function`, not an arrow function (arrow functions can't be called with `new`, throws "is not a constructor").
- [x] `app/api/get-participant-token/route.ts` → `GET` — **Full** (done, `__tests__/api/get-participant-token.test.ts`). Covers: no `userId` → 401; missing `room`/`username`/`serverId` → 400 each; membership check not ok → 403; `server_id` mismatch → 403; membership fetch throws → 403; missing LiveKit env vars → 500; success → JWT returned with correct `addGrant` call. Same arrow-vs-function-constructor gotcha applies to mocking `livekit-server-sdk`'s `AccessToken`.

Excluded (Skip): `components/server/roles/index.ts` (barrel re-export, no logic), `next.config.ts` (declarative config, nothing to execute).
