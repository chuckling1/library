# Frontend Dockerfile - Multi-stage build for React + Vite application
# Stage 1: Build environment with Node.js
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies for native modules (if needed)
RUN apk add --no-cache python3 make g++

# Copy package files for dependency caching
COPY package*.json ./

# Install dependencies (cached layer if package files unchanged)
RUN npm ci --only=production --ignore-scripts

# Install development dependencies for building
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Production server with Nginx
FROM nginx:alpine AS runtime

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]