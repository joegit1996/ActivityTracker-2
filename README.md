# Activity Tracker Web App

A modern, internationalized Activity Tracker Web App for tracking user progress across multilingual campaigns, with a robust admin dashboard, mini rewards system, and real-time updates.

## 🌟 Features

- **🌍 Multilingual**: Full support for English & Arabic (RTL/LTR)
- **📊 Progress Tracking**: Visual streaks, progress bars, completion tracking, and mini rewards
- **⚙️ Admin Dashboard**: Complete management UI for campaigns, milestones, and mini rewards
- **🎁 Mini Rewards System**: Configurable rewards displayed between progress days
- **📱 Responsive Design**: Mobile-first approach, works seamlessly on all devices
- **⚡ Real-time Updates**: Dynamic data updates with smooth user experience
- **🔐 Secure Authentication**: JWT-based authentication with session management
- **🎨 Animated UI**: Smooth animations, animated reward icons, and transitions
- **🍪 Smart User ID Resolution**: Robust user ID extraction from URLs and cookies
- **🐳 Docker Ready**: Full containerization support for easy deployment

## 🛠️ Tech Stack

### Frontend
- **React** (TypeScript) - Modern UI framework
- **Vite** - Fast build tooling and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality component library
- **TanStack Query** - Powerful data synchronization
- **Wouter** - Minimalist routing
- **i18next** - Internationalization framework
- **Framer Motion** - Smooth animations
- **Lucide Icons** & **Font Awesome** - Beautiful icon sets

### Backend
- **Express.js** (TypeScript) - Web application framework
- **MySQL** - Relational database
- **Drizzle ORM** - Type-safe database toolkit
- **JWT** - Secure authentication tokens
- **bcrypt** - Password hashing
- **Express Rate Limiting** - API protection

### Development Tools
- **ESBuild** - Fast JavaScript bundler
- **TypeScript** - Type safety
- **PostCSS** - CSS processing
- **Docker** - Containerization

## 📋 Prerequisites

- **Node.js** 18+ (Node 20+ supported)
- **MySQL** database (local or remote)
- **npm** or **yarn** package manager
- **Docker** (optional, for containerized deployment)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/joegit1996/ActivityTracker-2.git
cd ActivityTracker-2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your-mysql-username
DB_PASSWORD=your-mysql-password
DB_NAME=your-database-name
DB_PORT=3306

# Authentication Secrets
SESSION_SECRET=your-secure-session-secret-here
JWT_SECRET=your-secure-jwt-secret-here

# API Security
WEBHOOK_TOKEN=your-webhook-token-for-milestone-completion

# Application Settings
NODE_ENV=development
PORT=5000
DOMAIN=localhost

# External API (if using cookie-based user resolution)
EXTERNAL_API_BASE_URL=https://services.q84sale.com
```

**💡 Environment Variables Tips:**
- Use strong, unique secrets for `SESSION_SECRET` and `JWT_SECRET`
- Change `PORT` if 5000 is already in use on your system
- Ensure your MySQL user has CREATE permissions for automatic table creation

### 4. Database Setup
The application will automatically create required tables when you first run it, provided your MySQL user has the necessary permissions.

To manually push schema changes:
```bash
npm run db:push
```

### 5. Run the Application

#### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:5000` (or your configured PORT).

#### Production Build
```bash
npm run build
npm start
```

## 🐳 Docker Deployment

### Prerequisites for Docker
- Docker installed and running
- `.env` file configured (see Environment Configuration above)
- Accessible MySQL database

### Build the Docker Image
```bash
docker build -t activitytracker-app .
```

### Run with Docker
```bash
# Using .env file (recommended)
docker run -p 5001:5001 --env-file .env activitytracker-app

# Or with individual environment variables
docker run -p 5001:5001 \
  -e DB_HOST=your-db-host \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e DB_NAME=your-db-name \
  -e JWT_SECRET=your-jwt-secret \
  -e SESSION_SECRET=your-session-secret \
  activitytracker-app
```

### Access the Application
- Main app: `http://localhost:5001`
- Health check: `http://localhost:5001/health`
- Admin panel: `http://localhost:5001/admin`

### Docker Management
```bash
# List running containers
docker ps

# Stop a container
docker stop <container_id>

# View container logs
docker logs <container_id>

# Remove unused containers and images
docker system prune
```

## 👨‍💼 Admin Panel

Access the admin dashboard at `http://localhost:<PORT>/admin`

### Default Credentials
- **Username:** `admin`
- **Password:** `admin123`

*⚠️ Change these credentials in production!*

### Admin Features
- **Campaign Management**: Create, edit, and manage activity campaigns
- **Milestone Configuration**: Set up progress milestones with multilingual support
- **Mini Rewards System**: Configure rewards shown between progress days
- **User Progress Monitoring**: View user activity and completion rates
- **Multilingual Content**: Manage English and Arabic content versions

### Mini Rewards Configuration
- Add rewards that appear between specific days
- Set English (`title_en`, `description_en`) and Arabic (`title_ar`, `description_ar`) content
- Configure unlock conditions and visual states
- Preview how rewards appear in the user timeline

## 🎯 User Experience Features

### Progress Tracking
- **Visual Timeline**: Clear day-by-day progress visualization
- **Milestone Completion**: Track individual goal achievements
- **Animated Rewards**: Font Awesome animated icons for engagement
- **Completion Status**: Clear locked/unlocked states for content

### Smart User ID Resolution
The app supports multiple methods for identifying users:

1. **Direct URL**: `/web/en/progress/12345/1` - Uses user ID from URL
2. **Cookie Resolution**: `/web/en/progress//1` - Extracts user ID from cookies
3. **Placeholder Replacement**: `/web/en/progress/{{userid}}/1` - Replaces placeholder with actual ID

### Internationalization
- **Language Support**: English (LTR) and Arabic (RTL)
- **Dynamic Switching**: Users can change language preference
- **Localized Content**: All text, dates, and numbers respect locale settings
- **RTL Layout**: Proper right-to-left layout for Arabic content

## 🔧 API Reference

### Public Endpoints
```
GET  /health                              # Application health check
GET  /api/progress/:userId/:campaignId    # User progress data
POST /api/milestone/complete              # Complete a milestone (webhook)
```

### Admin Endpoints (JWT Required)
```
POST /admin/login                         # Admin authentication
GET  /admin/campaigns                     # List all campaigns
GET  /admin/campaigns/:id/milestones      # Campaign milestones
GET  /admin/campaigns/:id/mini-rewards    # Campaign mini rewards
POST /admin/campaigns/:id/mini-rewards    # Create mini reward
PUT  /admin/mini-rewards/:id              # Update mini reward
DELETE /admin/mini-rewards/:id            # Delete mini reward
```

### Request Headers
```
Authorization: Bearer <jwt-token>         # For admin endpoints
Content-Type: application/json           # For POST/PUT requests
```

## 📁 Project Structure

```
ActivityTracker-2/
├── client/                    # React frontend application
│   ├── public/               # Static assets
│   │   ├── fonts/           # SakrPro font family
│   │   └── kim-cash.gif     # Reward animations
│   └── src/
│       ├── components/      # Reusable UI components
│       │   └── ui/         # Shadcn/ui component library
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Application pages/routes
│       ├── lib/            # Utility functions and configurations
│       └── i18n/           # Internationalization setup
│           └── locales/    # Translation files (en.json, ar.json)
├── server/                   # Express.js backend
│   ├── db.ts              # Database connection and configuration
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # File storage utilities
│   ├── index.ts           # Main server entry point
│   └── vite.ts            # Vite development middleware
├── shared/                   # Shared code between frontend/backend
│   ├── schema.ts          # Database schema definitions
│   └── utils.ts           # Shared utility functions
├── attached_assets/          # Documentation and design assets
├── .env                     # Environment variables (create from template)
├── Dockerfile              # Docker container configuration
├── package.json            # Node.js dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── vite.config.ts          # Vite build configuration
└── drizzle.config.ts       # Database ORM configuration
```

## 📜 Available Scripts

```bash
# Development
npm run dev                   # Start development server with hot reload
npm run dev:frontend         # Start only Vite frontend dev server

# Building
npm run build                # Build both client and server for production
npm run build:client        # Build only the React frontend
npm run build:server        # Build only the Express backend

# Production
npm start                    # Start production server

# Database
npm run db:push              # Push schema changes to database

# Type Checking
npm run check                # Run TypeScript type checking
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Port Already in Use
```bash
# Error: EADDRINUSE: address already in use :::5000
```
**Solution:** Change the PORT in your `.env` file:
```env
PORT=5001
```

#### Database Connection Issues
```bash
# Error: DB_USER, DB_PASSWORD, and DB_NAME must be set
```
**Solutions:**
1. Ensure `.env` file exists and is properly formatted
2. Verify database credentials are correct
3. Check that MySQL server is running and accessible
4. Ensure database user has proper permissions

#### Docker Port Conflicts
```bash
# Error: port is already allocated
```
**Solution:** Use a different host port:
```bash
docker run -p 5002:5001 --env-file .env activitytracker-app
```

#### Environment Variables Not Loading
**Solutions:**
1. Ensure `.env` file is in the project root directory
2. Check that `.env` file is not empty
3. Restart the development server after making changes
4. Verify file encoding is UTF-8

#### Missing Vite Dependencies in Docker
```bash
# Error: Cannot find package 'vite'
```
**Solution:** This is typically resolved by rebuilding the Docker image:
```bash
docker build --no-cache -t activitytracker-app .
```

#### TypeScript Compilation Errors
**Solution:** Ensure all type dependencies are installed:
```bash
npm install --save-dev @types/node @types/express
```

### Performance Tips
- Use `npm run build` for production deployments
- Enable database connection pooling for high-traffic scenarios
- Consider using a CDN for static assets in production
- Implement Redis caching for frequently accessed data

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper commit messages
4. **Add tests** for new functionality
5. **Ensure all tests pass**: `npm run check`
6. **Submit a pull request** with a clear description

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Add JSDoc comments for public APIs
- Ensure responsive design for all new UI components
- Test both English and Arabic language modes

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

For questions, bug reports, or feature requests:

1. **Issues**: Create an issue on [GitHub](https://github.com/joegit1996/ActivityTracker-2/issues)
2. **Documentation**: Check this README and inline code comments
3. **Community**: Join our discussions on GitHub

## 🔒 Security

### Important Security Notes
- Database credentials are never logged or exposed in console output
- JWT tokens are securely generated and validated
- Session secrets should be strong and unique in production
- Admin credentials should be changed from defaults immediately

### Reporting Security Issues
Please report security vulnerabilities privately by emailing the development team rather than creating public issues.

---

## 📊 Advanced Configuration

### Custom Font Integration
The app uses SakrPro font family by default. To customize:

1. Add your fonts to `client/public/fonts/`
2. Update `client/src/index.css` with new font-face declarations
3. Modify `tailwind.config.ts` to include new font families

### External API Integration
The app supports external user authentication APIs. Configure in your environment:

```env
EXTERNAL_API_BASE_URL=https://your-api-domain.com
```

### Proxy Configuration
For development, Vite proxies are configured to handle:
- `/api` → Express backend (`http://localhost:5001`)
- `/external-api` → External authentication service

This prevents CORS issues during development while maintaining clean production URLs.

---

**Built with ❤️ using modern web technologies**