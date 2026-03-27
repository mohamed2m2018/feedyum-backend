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

# Copy built landing page into public/
COPY --from=landing-build /landing/out/index.html /app/public/index.html
COPY --from=landing-build /landing/out/delete-account.html /app/public/delete-account.html
COPY --from=landing-build /landing/out/privacy-policy.html /app/public/privacy-policy.html
COPY --from=landing-build /landing/out/about.html /app/public/about.html
COPY --from=landing-build /landing/out/contact.html /app/public/contact.html
COPY --from=landing-build /landing/out/delivery-policy.html /app/public/delivery-policy.html
COPY --from=landing-build /landing/out/refund-policy.html /app/public/refund-policy.html
COPY --from=landing-build /landing/out/terms-of-service.html /app/public/terms-of-service.html
COPY --from=landing-build /landing/out/_next/ /app/public/_next/
COPY --from=landing-build /landing/out/images/ /app/public/images/

# Cloud Run sets PORT environment variable
ENV PORT=8080
ENV NODE_ENV=production

# Expose the port
EXPOSE 8080

# Run the application (use node directly, not nodemon)
CMD ["node", "server.js"]
