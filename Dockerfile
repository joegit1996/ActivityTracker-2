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

# Build the frontend and server
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S activityapp -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only (do not install vite or @vitejs/plugin-react)
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=activityapp:nodejs /app/dist ./dist
COPY --from=builder --chown=activityapp:nodejs /app/dist/public ./dist/public
COPY --from=builder --chown=activityapp:nodejs /app/vite.config.ts ./vite.config.ts

# Create the public directory in the correct location
RUN mkdir -p ./dist/public && \
    mv ./dist/public/* ./dist/public/ || true

# Set environment variables (use .env or deployment environment for PORT and secrets)
# ENV PORT=5000  # Removed, use .env or deployment environment instead

# Expose port (configurable via environment)
EXPOSE ${PORT}

# Switch to non-root user
USER activityapp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]