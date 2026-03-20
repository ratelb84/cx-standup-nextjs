# CX Standup - Next.js Version

Complete rewrite of CX Standup as a modern Next.js application with all sections from the original:

## Features

- **Dashboard** - Overview with metrics and charts
- **Weekly Feedback** - Weekly submission and status tracking
- **Action Items** - Priority board, list view, by person, summary
- **AU Projects Tracker** - Kanban-style project management
- **Risk Register** - Risk tracking and management
- **Admin Panel** - User management and permissions

## Setup

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Deployment

```bash
npm run build
npm run start
```

Deploy to Vercel with:
```bash
vercel
```

## Test Users

All users from the original cx-standup app:
- don / Don123!
- mark / Mark123!
- kerushan / Kerushan123!
- etc.

All stored in Supabase `cx_standup_users` table.
