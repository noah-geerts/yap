# Image with Node and npm
FROM node:22-alpine

# Set working directory in container
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production
RUN npm install typescript

# Copy files
COPY . .

# Compile
RUN npx tsc

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Specify run command
CMD ["node", "./dist/index.js"]