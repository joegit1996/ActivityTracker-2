# Activity Streak Web App

An advanced internationalized Activity Streak Web App that provides a dynamic, engaging user experience for tracking personal progress across multilingual campaigns.

## Features

- **Multilingual Support**: Full Arabic and English support with RTL/LTR text alignment
- **Progress Tracking**: Visual progress bars, streak counters, and completion percentages
- **Campaign Management**: Admin interface for creating and managing campaigns
- **Milestone System**: Daily tasks with completion tracking
- **Responsive Design**: Mobile-first design optimized for all devices
- **Real-time Updates**: Dynamic progress updates and animations
- **Admin Dashboard**: Complete campaign and user management

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/ui components
- React Query for data management
- Wouter for routing
- i18next for internationalization
- Framer Motion for animations

### Backend
- Express.js with TypeScript
- MySQL database
- Drizzle ORM
- JWT authentication
- bcrypt for password hashing
- Express Rate Limiting

## Prerequisites

- Node.js 18+ 
- MySQL database
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd activity-streak-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory with the following variables:
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
   
   # Optional: Webhook Token for milestone completion API
   WEBHOOK_TOKEN=your-webhook-token
   
   # Environment Configuration
   NODE_ENV=development
   PORT=5000
   ```

4. **Database Setup**
   
   The application will create the necessary MySQL tables automatically. Ensure your MySQL user has CREATE table permissions.

5. **Start the application**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5000`

## Docker Deployment

### Building the Docker Image
```bash
docker build -t activity-streak-app .
```

### Running with Docker
```bash
docker run -p 80:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DB_HOST=your-production-db \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e DB_NAME=your-db-name \
  -e SESSION_SECRET=your-session-secret \
  -e JWT_SECRET=your-jwt-secret \
  -e WEBHOOK_TOKEN=your-webhook-token \
  activity-streak-app
```

### Running on Different Port
```bash
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e DB_HOST=your-production-db \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e DB_NAME=your-db-name \
  -e SESSION_SECRET=your-session-secret \
  -e JWT_SECRET=your-jwt-secret \
  -e WEBHOOK_TOKEN=your-webhook-token \
  activity-streak-app
```

### Health Check
The Docker container includes a health check endpoint at `/health` that monitors:
- Server status
- Application uptime
- Environment information

## API Reference

### Frontend Web Pages
- `/` - Main application homepage
- `/web/en/progress/:userId` - English progress tracking page
- `/web/ar/progress/:userId` - Arabic progress tracking page (RTL layout)
- `/web/en/admin` - English admin dashboard
- `/web/ar/admin` - Arabic admin dashboard
- `/admin` - Admin login page

### Public API Endpoints
- `GET /health` - Health check for monitoring and Docker
- `GET /api/progress/:userId/:campaignId?lang=en|ar` - Get user progress for specific campaign

### Webhook API (Token Required)
- `POST /api/milestone/complete` - Complete a milestone task

### Admin Management API (JWT Required)

**Authentication:**
- `POST /admin/login` - Admin login
- `GET /admin/me` - Get current admin details
- `POST /admin/logout` - Admin logout

**Campaign Management:**
- `GET /admin/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

**Milestone Management:**
- `GET /admin/campaigns/:campaignId/milestones` - Get milestones for campaign
- `POST /api/milestones` - Create new milestone
- `PUT /api/milestones/:id` - Update milestone
- `DELETE /api/milestones/:id` - Delete milestone

## Database Schema

### Tables
- **users**: User information and language preferences
- **campaigns**: Campaign details in multiple languages
- **milestones**: Daily tasks within campaigns
- **milestone_completions**: User progress tracking
- **admins**: Admin user accounts
- **campaign_completions**: Full campaign completion tracking

## Usage

### Admin Panel
1. Navigate to `/admin`
2. Login with admin credentials
3. Manage campaigns, view user progress, and track completions

### User Progress
Users can view their progress at:
- English: `/web/en/progress/:userId` 
- Arabic: `/web/ar/progress/:userId`

### Webhook Integration
The app supports milestone completion via webhook:
```bash
POST /api/milestone/complete
Content-Type: application/json
Authorization: Bearer <WEBHOOK_TOKEN>
# Or alternatively:
X-API-Token: <WEBHOOK_TOKEN>

{
  "user_id": 100,
  "campaign_id": 1,
  "day_number": 1,
  "milestone_id": 2
}
```

## Development

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Application pages
│   │   ├── lib/            # Utilities and configurations
│   │   └── i18n/           # Internationalization files
├── server/                 # Express backend
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
└── README.md
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run db:push` - Push database schema changes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team.