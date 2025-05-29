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
   
   # Optional: Webhook
   WEBHOOK_TOKEN=your-webhook-token
   ```

4. **Database Setup**
   
   The application will create the necessary MySQL tables automatically. Ensure your MySQL user has CREATE table permissions.

5. **Start the application**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5000`

## API Endpoints

### Public Endpoints
- `GET /api/progress/:userId/:campaignId` - Get user progress for a campaign
- `POST /api/complete-milestone` - Complete a milestone (webhook)

### Admin Endpoints
- `POST /api/login` - Admin login
- `POST /api/logout` - Admin logout
- `GET /api/me` - Get current admin info
- `GET /api/admin/campaigns` - Get all campaigns
- `GET /api/admin/campaigns/:id/milestones` - Get campaign milestones
- `GET /api/admin/completions` - Get all milestone completions
- `GET /api/admin/campaign-completions` - Get campaign completions

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
1. Navigate to `/web/en/admin` or `/web/ar/admin`
2. Login with admin credentials
3. Manage campaigns, view user progress, and track completions

### User Progress
Users can view their progress at:
- English: `/web/en/progress/:userId/:campaignId`
- Arabic: `/web/ar/progress/:userId/:campaignId`

### Webhook Integration
The app supports milestone completion via webhook:
```bash
POST /api/complete-milestone
Content-Type: application/json
Authorization: Bearer <WEBHOOK_TOKEN>

{
  "user_id": 12344,
  "campaign_id": 1,
  "milestone_id": 5
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