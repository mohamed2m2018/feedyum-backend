# Stage 1: Build the Next.js landing page
FROM node:22.22.0 AS landing-build
WORKDIR /landing
COPY landing/package*.json ./
RUN npm install
COPY landing/ ./
RUN npm run build

# Stage 2: Backend
FROM node:22.22.0

# Install ffmpeg for audio processing
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy application code
COPY . /app

# Copy the whole built landing site into public/ (pages are exported as
# folder/index.html, plus sitemap.xml, images and _next assets)
COPY --from=landing-build /landing/out/ /app/public/

# Cloud Run sets PORT environment variable
ENV PORT=8080
ENV NODE_ENV=production

# Expose the port
EXPOSE 8080

# Run the application (use node directly, not nodemon)
CMD ["node", "server.js"]
