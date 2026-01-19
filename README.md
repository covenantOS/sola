# Sola+ 2.0

Creator platform for Christian creators, pastors, and ministries.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Supabase) + Redis (Upstash)
- **Auth**: Logto
- **Payments**: Stripe Connect Express
- **Video**: Mux (VOD) + LiveKit (Livestreaming)
- **UI**: Shadcn/ui + Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (optional, for local services)

### Installation

```bash
# Clone the repo
git clone https://github.com/covenantOS/sola.git
cd sola

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Start development server
pnpm dev
```

### Environment Setup

See `.env.example` for all required environment variables. You'll need accounts for:

- Supabase (database)
- Upstash (Redis)
- Stripe (payments)
- Mux (video)
- LiveKit (livestreaming)
- Cloudflare R2 (storage)
- Resend (email)
- Logto (auth)

## Project Structure

```
sola/
├── apps/
│   ├── web/           # Main Next.js application
│   └── builder/       # Site builder (future)
├── packages/
│   ├── database/      # Prisma client
│   ├── auth/          # Logto integration
│   ├── payments/      # Stripe Connect
│   ├── video/         # Mux + LiveKit
│   ├── realtime/      # Socket.IO
│   ├── email/         # Resend
│   ├── ui/            # Shared components
│   └── config/        # Shared configs
├── prisma/
│   └── schema.prisma  # Database schema
└── docs/              # Documentation
```

## Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build all packages
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Prisma Studio
```

## Documentation

See `/docs` for technical documentation and build plans.

## License

Private - All rights reserved.
