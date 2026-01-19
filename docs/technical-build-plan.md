# Sola+ 2.0 Technical Build Plan

## Overview

Sola+ 2.0 is a creator platform for Christian creators, pastors, and ministries competing with Patreon, Circle, Skool, Kajabi, and GoHighLevel.

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Next.js 14 (App Router) | Frontend + API |
| UI | Shadcn/ui + Tailwind CSS | Components |
| Database | PostgreSQL (Supabase) | Primary data store |
| Cache | Redis (Upstash) | Sessions, real-time |
| ORM | Prisma | Database access |
| Auth | Logto | Multi-tenant authentication |
| Payments | Stripe Connect Express | Creator payouts |
| Video | Mux | VOD hosting, transcoding |
| Livestream | LiveKit | Real-time WebRTC |
| Storage | Cloudflare R2 | Media files |
| Email | Resend | Transactional emails |
| Feature Flags | Flagsmith | Rollouts, A/B testing |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SOLA+ 2.0                              │
├─────────────────────────────────────────────────────────────┤
│  apps/web (Next.js 14)                                      │
│  ├── Member Dashboard                                       │
│  ├── Creator Dashboard                                      │
│  ├── Community (channels, posts, comments)                  │
│  ├── Courses (modules, lessons, video player)               │
│  ├── Livestreaming (LiveKit integration)                    │
│  └── Settings & Billing                                     │
├─────────────────────────────────────────────────────────────┤
│  packages/                                                   │
│  ├── @sola/database    - Prisma client                      │
│  ├── @sola/auth        - Logto integration                  │
│  ├── @sola/payments    - Stripe Connect                     │
│  ├── @sola/video       - Mux + LiveKit                      │
│  ├── @sola/realtime    - Socket.IO                          │
│  ├── @sola/email       - Resend                             │
│  └── @sola/ui          - Shared components                  │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure                                              │
│  ├── PostgreSQL (Supabase)                                  │
│  ├── Redis (Upstash)                                        │
│  ├── R2 (Cloudflare)                                        │
│  └── Vercel (Hosting)                                       │
└─────────────────────────────────────────────────────────────┘
```

## Multi-Tenancy Model

- Each creator has an **Organization**
- Organizations get a subdomain: `{slug}.my.solaplus.ai`
- Members belong to Organizations through **Memberships**
- Membership tiers control access to content

## Stripe Connect Flow

1. Creator signs up → Create Stripe Express Account
2. Stripe handles KYC/identity verification
3. Creator's members pay → Platform takes fee → Money routes to creator's bank

```
Member Payment → Sola+ Platform (5% fee) → Creator's Stripe → Creator's Bank
```

## Build Phases

### Phase 1: Foundation
- [x] Set up Turborepo monorepo
- [x] Configure Prisma schema
- [ ] Deploy Logto for auth
- [ ] Implement Next.js app shell
- [ ] Stripe Connect onboarding

### Phase 2: Community
- [ ] Channel system
- [ ] Posts with rich content
- [ ] Comments (nested)
- [ ] Reactions
- [ ] Real-time updates (Socket.IO)

### Phase 3: Courses
- [ ] Course/Module/Lesson structure
- [ ] Mux video integration
- [ ] Video player with progress
- [ ] Drip content
- [ ] Enrollment tracking

### Phase 4: Livestreaming
- [ ] LiveKit room creation
- [ ] "Go Live" UI
- [ ] Viewer experience
- [ ] Chat during streams
- [ ] Recording to Mux

### Phase 5: Site Builder (Future)
- [ ] Fork Framely
- [ ] Swap Clerk → Logto
- [ ] Custom Sola+ blocks
- [ ] Custom domain support

## Database Schema

See `/prisma/schema.prisma` for complete schema including:
- Users, Organizations, Memberships
- Communities, Channels, Posts, Comments, Reactions
- Courses, Modules, Lessons, Enrollments
- Conversations, Messages
- Livestreams, Media
- Webhooks, API Keys

## Key Decisions

1. **Logto over Clerk**: Self-hosted, no MAU fees, full control
2. **Stripe Connect Express**: Creators own their Stripe accounts
3. **Mux + LiveKit**: Best-in-class video + real-time streaming
4. **Supabase PostgreSQL**: Managed, scalable, good DX
5. **Upstash Redis**: Serverless, scales with usage

## External Services Required

| Service | Account Needed | Purpose |
|---------|----------------|---------|
| Supabase | Yes | PostgreSQL database |
| Upstash | Yes | Redis cache |
| Stripe | Yes | Payments |
| Mux | Yes | Video hosting |
| LiveKit | Yes (Cloud or self-host) | Livestreaming |
| Cloudflare | Yes | R2 storage, DNS |
| Resend | Yes | Transactional email |
| Logto | Yes (Cloud or self-host) | Authentication |
| Vercel | Yes | Hosting |
