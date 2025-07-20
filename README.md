# Activity Streak Web App

A modern, internationalized Activity Streak Web App for tracking progress across multilingual campaigns, with a robust admin dashboard, mini rewards, and real-time updates.

## Features

- **Multilingual**: English & Arabic (RTL/LTR)
- **Progress Tracking**: Visual streaks, progress bars, completion, and mini rewards
- **Campaign, Milestone & Mini Reward Management**: Full admin UI for all
- **Mini Rewards**: Configurable rewards shown between days, managed from admin panel
- **Responsive**: Mobile-first, works on all devices
- **Real-time**: Dynamic updates, smooth UX
- **Secure**: JWT authentication, session management
- **Animated UI**: Animated icons for rewards, smooth transitions

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
- Lucide icons
- Font Awesome (animated icons, e.g., sack dollar for rewards)

### Backend
- Express.js (TypeScript)
- MySQL database
- Drizzle ORM
- JWT authentication
- bcrypt for password hashing
- dotenv
- Express Rate Limiting

### Fonts
- Uses the SakrPro font family globally (see `client/public/fonts/` and `client/src/index.css` for customization)

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
# For animated reward icon:
npm install --save @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
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
- **Mini Rewards:** Ensure your DB has the `mini_rewards` table (see migrations or schema).

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
- Manage campaigns, milestones, and mini rewards
- **Mini Rewards:**
  - Add, edit, and delete mini rewards for each campaign
  - Each mini reward has English & Arabic title/description, and is shown after a specific day
  - Mini rewards are displayed between days on the user progress timeline
- **Milestone Titles:**
  - Milestone titles are shown using `title_en` (English) or `title_ar` (Arabic). If you see missing titles, ensure your milestones have these fields populated.
- **Admin UI Improvements:**
  - All fields for mini rewards (EN/AR) are now visible and editable
  - Editing a mini reward pre-fills all values

## Mini Rewards
- **What are Mini Rewards?**
  - Configurable rewards shown between days on the progress timeline
  - Managed from the admin panel under the "Mini Rewards" tab
  - Each reward can have English and Arabic title/description
  - Shown to users after completing the specified day
  - Locked/unlocked state is visually indicated

## Progress Page & User Experience
- **Animated Reward Icon:**
  - The main reward section now shows an animated Font Awesome sack dollar icon (blue, with padding) if the user hasn't completed all days
  - Text: "Complete all milestones for a big CASH reward" (or Arabic translation)
- **Timeline:**
  - Unified timeline: for each day, the day card is shown, and any mini rewards for that day are rendered immediately after
  - Mini rewards are never duplicated or misplaced
  - Locked/unlocked state for mini rewards is visually clear
- **Current Day:**
  - The current day's milestones/tasks are shown inside the day's card
- **Locked Days:**
  - Locked days have a visually improved lock icon inside a soft gray circle

## API Reference

### Authentication
- All `/admin` endpoints require a JWT token (login via `/admin/login`).
- Pass the token as `Authorization: Bearer <token>`.

### Main Endpoints
- `GET /health` — Health check
- `GET /api/progress/:userId/:campaignId?lang=en|ar` — User progress (includes mini rewards)
- `POST /api/milestone/complete` — Complete a milestone (requires `WEBHOOK_TOKEN`)
- `GET /admin/campaigns/:campaignId/milestones` — Milestones for a campaign (JWT required)
- `GET /admin/api/campaigns/:campaignId/mini-rewards` — Mini rewards for a campaign (JWT required)

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
- **Mini rewards not showing:** Ensure your DB has the `mini_rewards` table and your API returns them for the campaign

## Contributing
1. Fork the repo
2. Create a feature branch
3. Make changes & add tests
4. Submit a pull request

## License
MIT

## Support
For questions or support, contact the development team.

## Security Note
Database credentials are read from `.env` and are **never logged** or exposed. (Console logging removed from server/db.ts)

## User ID Extraction & Cookie Flow (v3+)

### Robust User ID Handling
- The progress page now supports extracting the user ID from multiple sources:
  - **URL param**: If present and non-empty, used directly.
  - **Placeholder or missing**: If the URL contains `/web/en/progress/{{userid}}/1` or `/web/en/progress//1`, the app will:
    - Read the `_xyzW` cookie for a token.
    - Call the external API (`/external-api/api/v1/users/auth/user`) to fetch the user ID.
    - Automatically update the URL to include the resolved user ID for shareability and clarity.
- If both the URL and cookie flow fail, a user-friendly error is shown.

### Router Normalization
- The router now automatically normalizes double slashes in URLs (e.g., `/web/en/progress//1` → `/web/en/progress/1`).
- URLs with the placeholder `{{userid}}` are also supported and replaced with the real user ID after resolution.

### Vite Proxy Setup
- The Vite dev server proxies:
  - `/api` → `http://localhost:5001` (Express backend)
  - `/external-api` → `https://services.q84sale.com` (external user info API)
- This allows the frontend to call both local and external APIs without CORS or CSP issues in development.

### Defensive Error Handling
- All fetch calls now check for valid JSON responses and handle HTML or error responses gracefully.
- The progress page will never attempt to fetch with an invalid or empty user ID.

### Example Flows
- `/web/en/progress/12345/1` → Uses userId from URL.
- `/web/en/progress//1` or `/web/en/progress/{{userid}}/1` → Uses cookie flow, updates URL to `/web/en/progress/<realUserId>/1`.

### Why This Matters
- This makes the app robust for webviews, deep links, and SSO scenarios where the user ID may not be in the URL.
- Ensures a seamless experience for both direct and embedded usage.

## Docker Deployment

### Prerequisites
- [Docker](https://www.docker.com/) installed on your machine
- A `.env` file in the project root with your database and app environment variables (see `.env.example` if available)
- A running and accessible database (MySQL)

### Build the Docker Image
```sh
docker build -t activitytracker-app .
```

### Run the Docker Container
```sh
docker run -p 5001:5001 --env-file .env activitytracker-app
```
- This maps port 5001 on your machine to port 5001 in the container (adjust if your app uses a different port)
- The `--env-file .env` flag loads environment variables from your `.env` file

### Access the App
- Open [http://localhost:5001](http://localhost:5001) in your browser
- If you have a `/health` endpoint, check [http://localhost:5001/health](http://localhost:5001/health)

### Troubleshooting
- If you see `port is already allocated`, stop the previous container or use a different port:
  ```sh
  docker ps
  docker stop <container_id>
  ```
- If you see database connection errors, check your `.env` file and ensure your database is running and accessible from the container

### Stopping the Container
- To stop the running container:
  ```sh
  docker ps
  docker stop <container_id>
  ```

---