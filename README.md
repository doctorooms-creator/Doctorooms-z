# Doctorooms-z

A comprehensive healthcare management platform built with Next.js 16, featuring role-based dashboards for patients, doctors, receptionists, and administrators.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style)
- **Database**: SQLite via Prisma ORM
- **State Management**: Zustand (client) + TanStack Query (server)
- **Auth**: NextAuth.js v4
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Features

### Patient Module ✅
- Dashboard with appointment stats
- Doctor search & booking
- Appointment management with date range filters
- Walk-in registration
- Profile management with avatar upload
- Blog/Posts CRUD
- Health records
- Video call integration

### Doctor Module
- Dashboard with earnings & analytics
- Schedule & slot management
- Queue management
- Patient management
- Public profile

### Reception Module
- Dashboard with today's overview
- Appointment management
- Walk-in registration
- Doctor schedule management
- Patient search

### Admin Module
- User management
- System configuration
- Analytics & reporting

## Getting Started

```bash
# Install dependencies
bun install

# Set up database
bun run db:push

# Start development server
bun run dev
```

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/
│   │   ├── patient/      # Patient dashboard
│   │   ├── doctor/       # Doctor dashboard
│   │   ├── reception/    # Reception dashboard
│   │   └── admin/        # Admin dashboard
│   └── (auth)/           # Authentication pages
├── components/
│   ├── ui/               # shadcn/ui components
│   └── dashboard/        # Shared dashboard components
├── lib/
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth config
│   └── sidebar-config.ts # Role-based sidebar
└── types/                # TypeScript types
```

## License

Private - All rights reserved.
