## Legal AI Frontend (Next.js + Tailwind + shadcn)

A Next.js dashboard frontend for Legal AI. Supports dark/light themes, environment-driven backend URLs, and a minimal auth flow ready to integrate with the Bun/Hono backend.

Backend reference:

- Base URL: `http://localhost:4242`
- API Base Path: `/api`
- Docs: `http://localhost:4242/docs`

### 1) Install

```bash
bun install
```



### 2) Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4242
NEXT_PUBLIC_API_BASE_PATH=/api
```

You can override these for other environments. Only public URLs are needed for the browser; tokens are stored in `localStorage` by default in this starter.

### 3) Dev

```bash
bun run dev
```

Open `http://localhost:3000`.

### 4) Theme

Dark/light theme is powered by `next-themes` and shadcn-friendly classnames. Use the header toggle on `/` or `/dashboard`.

### 5) Auth

- Login: `/login` calls `POST /api/user/login` and stores `token` in `localStorage`.
- Accept Invite: `/accept-invite?token=<uuid>` calls `POST /api/user/accept-invite`.
- Simple client guard redirects `/dashboard` to `/login` if no token.

Replace the client guard with a proper middleware/session solution as needed.

### 6) API Client

The API base is composed from env in `src/lib/utils.ts` and consumed via a small fetch wrapper in `src/lib/api-client.ts`.

### 7) Migrate from Vite App

Port components/pages from `legal-ai-ui` into Next.js routes under `src/app/`. Prefer server components, and mark interactive pages with `"use client"`.

### Scripts

- `bun run dev` — start dev server
- `bun run build` — build
- `bun run start` — production start
