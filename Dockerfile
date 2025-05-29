# Multi-stage build for Activity Streak App

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S activityapp -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=activityapp:nodejs /app/dist ./dist
COPY --from=builder --chown=activityapp:nodejs /app/client/dist ./client/dist
COPY --from=builder --chown=activityapp:nodejs /app/server ./server
COPY --from=builder --chown=activityapp:nodejs /app/shared ./shared

# Copy necessary config files
COPY --chown=activityapp:nodejs tsconfig.json ./
COPY --chown=activityapp:nodejs vite.config.ts ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port (configurable via environment)
EXPOSE $PORT

# Switch to non-root user
USER activityapp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]