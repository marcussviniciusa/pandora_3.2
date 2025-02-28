FROM node:18-alpine

# Set working directory
WORKDIR /app

# Add Chromium for WhatsApp Web
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories for logs and sessions
RUN mkdir -p logs whatsapp-sessions && \
    chmod -R 777 logs whatsapp-sessions

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]
