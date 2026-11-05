---
name: tech-stack-decisions
description: Confirmed technology choices for the sticker ecommerce platform
metadata:
  type: project
---

# Tech Stack Decisions - Sticker Ecommerce

## Confirmed Choices (via user clarification)

| Layer | Choice | Notes |
|-------|--------|-------|
| **Framework** | Next.js 14+ App Router + TypeScript | Server components, streaming, SEO |
| **Database** | PostgreSQL + Prisma ORM | Type-safe, migrations, relations |
| **Auth** | NextAuth.js (Credentials + Email) | Email/password only, no OTP for MVP |
| **Server State** | TanStack Query v5 | Caching, invalidation, optimistic updates |
| **Client State** | Zustand | Lightweight global state (cart, UI, auth) |
| **Real-time** | Socket.io (custom Node server) | Admin notifications, order status updates |
| **Payments** | Cash on Delivery / Bank Transfer | No gateway integration for MVP |
| **Images** | Uploadthing + Cloudinary | Next.js-native uploads + transformations |
| **Styling** | Tailwind CSS + CSS Variables | Design token integration |
| **Animations** | Framer Motion + CSS | Complex animations, layout transitions |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **UI Primitives** | Radix UI / Headless UI | Accessible, unstyled components |
| **Charts** | Recharts | Admin dashboard analytics |
| **Date/Time** | date-fns | Lightweight, tree-shakeable |
| **Notifications** | Sonner + custom badge | Beautiful toasts, sidebar badges |

## Key Integrations Needed
1. **Fabric.js** - Canvas manipulation for custom sticker builder
2. **Socket.io** - Separate server process for real-time
3. **Uploadthing** - File uploads with Next.js integration
4. **Cloudinary** - Image transformations, optimization, CDN
5. **NextAuth.js** - Authentication with Prisma adapter
5. **Prisma** - Database ORM with PostgreSQL

## Development Tools
- **Package Manager**: pnpm (recommended) or npm
- **Linting**: ESLint + Prettier
- **Testing**: Vitest (unit), React Testing Library (component), Playwright (E2E)
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (Next.js) + Railway/Render (Socket.io) + Neon/Supabase (PostgreSQL)

## Environment Variables Required
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
SOCKET_SERVER_URL="http://localhost:3001"
NODE_ENV="development"
```