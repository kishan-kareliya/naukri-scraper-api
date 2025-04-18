FROM node:20-slim

# Install dependencies for puppeteer
RUN apt-get update && apt-get install -y \
    chromium && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Build the TypeScript project
RUN npm run build

EXPOSE 8080

# Start the app
CMD ["node", "dist/server.js"]
