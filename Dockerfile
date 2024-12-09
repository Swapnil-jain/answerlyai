# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY postcss.config.mjs ./
COPY tailwind.config.ts ./
COPY components.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run the built application
FROM node:18-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Install only production dependencies
RUN npm ci --only=production

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]