FROM ghcr.io/puppeteer/puppeteer:24.6.1

# Set env variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable 

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy all project files
COPY . .

# Build the TypeScript project
RUN npm run build

# Start the app
CMD ["node", "dist/server.js"]
