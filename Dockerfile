FROM ghcr.io/puppeteer/puppeteer:24.6.1

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy all project files
COPY . .

# Build the TypeScript project
RUN npm run build

EXPOSE 3000

# Start the app
CMD ["node", "dist/server.js"]
