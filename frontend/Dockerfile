# 1. Base image
FROM node:18-alpine AS base
WORKDIR /app

# 2. Dependencies stage
FROM base AS deps
COPY package.json package-lock.json* ./
# If you have private packages, you might need to configure npm/yarn/pnpm accordingly
RUN npm ci # Installs all dependencies including dev for build

# 3. Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1 # Optional: Disable Next.js telemetry
# Set NEXT_PUBLIC_API_URL or other build-time env vars if needed
# ENV NEXT_PUBLIC_API_URL=http://localhost:3001
RUN npm run build

# 4. Production/Runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1 # Optional: Disable Next.js telemetry

# If NOT using output: 'standalone':
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
# Set HOSTNAME to 0.0.0.0 to accept connections from outside the container
ENV HOSTNAME 0.0.0.0
CMD ["npm", "start", "--", "-H", "0.0.0.0"]
