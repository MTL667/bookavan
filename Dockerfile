# BookAVan - Production-ready Dockerfile
# Node.js 20 Alpine for minimal image size

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for production
# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY server.js ./
COPY public ./public
COPY database ./database

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Set environment to production
ENV NODE_ENV=production

# Expose port 3000
EXPOSE 3000

# Note: Health checks are handled by Easypanel, not Docker
# Dockerfile HEALTHCHECK can conflict with Easypanel's health check system

# Run the application
CMD ["node", "server.js"]

