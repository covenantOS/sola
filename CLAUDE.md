# Sola+ 2.0 - Claude Code Instructions

## Project Overview
Sola+ 2.0 is a creator platform for Christian creators, pastors, and ministries. It competes with Patreon, Circle, Skool, Kajabi, and GoHighLevel.

## Architecture
- **Monorepo**: Turborepo with pnpm workspaces
- **Frontend**: Next.js 14 (App Router) + Shadcn/ui + Tailwind CSS
- **Database**: PostgreSQL (Supabase) + Redis (Upstash)
- **ORM**: Prisma
- **Auth**: Logto (cloud, multi-tenant)
- **Payments**: Stripe Connect Express (users connect their own Stripe accounts)
- **Video & Livestreaming**: Mux (hosting, transcoding, HLS streaming, live)
- **Real-time**: Socket.IO with Redis adapter
- **Storage**: Cloudflare R2 (S3-compatible)
- **Email**: Resend

## Key Directories
```
/apps/web          - Main Next.js application (member dashboard, creator dashboard)
/apps/builder      - Site builder (Framely fork) - FUTURE
/packages/database - Prisma client and schema
/packages/auth     - Logto integration
/packages/payments - Stripe Connect integration
/packages/video    - Mux integration (video + livestreaming)
/packages/realtime - Socket.IO server
/packages/email    - Transactional emails (Resend)
/packages/ui       - Shared React components (Shadcn/ui)
/packages/config   - Shared TypeScript/Tailwind configs
/docs              - Technical documentation
```

## Database Schema
The Prisma schema at `/prisma/schema.prisma` contains all models:
- Users, Organizations, Memberships (multi-tenant)
- Communities, Channels, Posts, Comments, Reactions
- Conversations, Messages (DMs)
- Courses, Modules, Lessons, Enrollments
- Livestreams, Media
- Webhooks, ApiKeys

## Multi-Tenancy Model
- Each creator has an Organization
- Organizations have subdomain: `{slug}.my.solaplus.ai`
- Custom domains supported (future)
- Members belong to Organizations through Memberships
- Stripe Connect Express: each Organization connects their own Stripe account

## Important Notes
1. **No homepage needed** - Homepage is hosted elsewhere
2. **Subdomain routing**: All creator sites use `*.my.solaplus.ai`
3. **Stripe Connect Express**: Platform takes application fee, money goes to creator's bank
4. **Video flow**: Mux for both VOD and livestreaming (RTMP ingest, HLS delivery)

## Build Order
1. Foundation: Auth (Logto), Database (Prisma), basic Next.js app
2. Stripe Connect: Onboarding flow, destination charges
3. Community: Channels, posts, comments, reactions, real-time
4. Courses: Modules, lessons, video player, progress tracking
5. Livestreaming: Mux Live integration
6. Site Builder: Framely fork (future phase)

## API Keys Location
All API keys should be in `.env.local` (never commit to git).
See `.env.example` for required variables.

## Commands
```bash
pnpm install          # Install all dependencies
pnpm dev              # Start development server
pnpm build            # Build all packages
pnpm db:push          # Push Prisma schema to database
pnpm db:studio        # Open Prisma Studio
pnpm db:generate      # Generate Prisma client
```

## Code Style
- TypeScript strict mode
- Functional React components with hooks
- Server components by default, 'use client' only when needed
- Zod for validation
- tRPC or Server Actions for API (prefer Server Actions for simplicity)
