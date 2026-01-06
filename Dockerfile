# Use Node.js LTS Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Cloud Run sets PORT environment variable
ENV PORT=8080
ENV NODE_ENV=production

# Expose the port
EXPOSE 8080

# Run the application (use node directly, not nodemon)
CMD ["node", "server.js"]
