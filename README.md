# Activity Streak Web App

A modern, internationalized Activity Streak Web App for tracking progress across multilingual campaigns, with a robust admin dashboard and real-time updates.

## Features

- **Multilingual**: English & Arabic (RTL/LTR)
- **Progress Tracking**: Visual streaks, progress bars, completion
- **Campaign & Milestone Management**: Full admin UI
- **Responsive**: Mobile-first, works on all devices
- **Real-time**: Dynamic updates, smooth UX
- **Secure**: JWT authentication, session management

## Tech Stack

### Frontend
- React (TypeScript)
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/ui components
- React Query for data management
- Wouter for routing
- i18next for internationalization
- Framer Motion for animations

### Backend
- Express.js (TypeScript)
- MySQL database
- Drizzle ORM
- JWT authentication
- bcrypt for password hashing
- dotenv
- Express Rate Limiting

## Prerequisites

- Node.js 18+ (Node 20+ supported; see troubleshooting for port issues)
- MySQL database
- npm (or yarn)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ActivityTracker-2
```

### 2. Install Dependencies
```bash
npm install
npm install --save-dev @types/node @types/express
dotenv # If not already installed
```

### 3. Environment Variables
Create a `.env` file in the project root:
```env
# Database Configuration
DB_HOST=your-mysql-host
DB_USER=your-mysql-username
DB_PASSWORD=your-mysql-password
DB_NAME=your-database-name
DB_PORT=3306

# Authentication
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret

# Webhook Token for milestone completion API
WEBHOOK_TOKEN=your-webhook-token

# Environment
NODE_ENV=development
PORT=5000 # Change if port 5000 is in use
DOMAIN=appstreak.q84sale.com
```
**Troubleshooting:**
- If environment variables are not being read, ensure `.env` is saved, not empty, and in the project root.
- If you see `DB_USER: undefined`, delete and re-create `.env`.

### 4. Database Setup
- The app auto-creates tables if your MySQL user has CREATE permissions.
- You can use `npm run db:push` to push schema changes (Drizzle ORM).

### 5. Running the App
- **Development:**
  ```bash
  npm run dev
  ```
  - If you see `EADDRINUSE: address already in use`, change `PORT` in `.env` (e.g., `PORT=5001`).
  - If you see `ENOTSUP: operation not supported on socket`, remove the `host` option from `server.listen` (already fixed in this repo).
- **Production Build:**
  ```bash
  npm run build
  npm run preview
  ```

## Admin Panel
- Visit: `http://localhost:<PORT>/admin`
- Login with your admin credentials (default: `admin`/`admin123` if seeded)
- Manage campaigns and milestones
- **Milestone Titles:**
  - Milestone titles are now shown using `title_en` (English) or `title_ar` (Arabic). If you see missing titles, ensure your milestones have these fields populated.

## API Reference

### Authentication
- All `/admin` endpoints require a JWT token (login via `/admin/login`).
- Pass the token as `Authorization: Bearer <token>`.

### Main Endpoints
- `GET /health` — Health check
- `GET /api/progress/:userId/:campaignId?lang=en|ar` — User progress
- `POST /api/milestone/complete` — Complete a milestone (requires `WEBHOOK_TOKEN`)
- `GET /admin/campaigns/:campaignId/milestones` — Milestones for a campaign (JWT required)

## Project Structure
```
ActivityTracker-2/
├── client/           # React frontend
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── lib/
│       └── i18n/
├── server/           # Express backend
│   ├── db.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── index.ts
├── shared/           # Shared types and schemas
├── .env              # Environment variables
├── package.json
└── README.md
```

## Scripts
- `npm run dev` — Start dev server
- `npm run build` — Build frontend & backend
- `npm run preview` — Preview production build
- `npm run db:push` — Push DB schema (Drizzle)

## Docker Usage
- **Build:**
  ```bash
  docker build -t activity-streak-app .
  ```
- **Run:**
  ```bash
  docker run -p 5000:5000 --env-file .env activity-streak-app
  ```
  - Or set env vars with `-e` flags as needed
- **Health Check:**
  - Visit `/health` endpoint inside the container

## Troubleshooting & Tips
- **Port in use:** Change `PORT` in `.env` if you see `EADDRINUSE` errors
- **ENOTSUP error:** Use only `server.listen(port, ...)` (already fixed)
- **Environment variables not loading:** Ensure `.env` is not empty, is in the root, and is saved
- **TypeScript errors:** Ensure `@types/node` and `@types/express` are installed and `tsconfig.json` includes them in `types`
- **Milestone titles not showing:** The frontend now uses `milestone.title_en`/`milestone.title_ar` — update your data if needed

## Contributing
1. Fork the repo
2. Create a feature branch
3. Make changes & add tests
4. Submit a pull request

## License
MIT

## Support
For questions or support, contact the development team.