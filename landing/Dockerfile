# Stage 1: Build static export
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build static export
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built static files from the 'out' directory
COPY --from=builder /app/out /usr/share/nginx/html

# Nginx config optimized for Next.js static export on Cloud Run
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run sets PORT env variable (default 8080)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
