# ---- Base Node ----
FROM node:18-alpine AS base
WORKDIR /usr/src/app

# ---- Dependencies ----
# Install production dependencies
FROM base AS dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# ---- Build ----
# Install all dependencies (including dev) and build the application
FROM base AS build
# Copy production node_modules from the 'dependencies' stage first
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
# Copy the rest of the package files
COPY package.json package-lock.json* ./
# Install all dependencies (this will include devDependencies now)
RUN npm install
# Copy the rest of the application source code
COPY . .
# Set NODE_ENV to production for build optimizations (though NestJS CLI often handles this)
ENV NODE_ENV=production
# Build the API application
RUN npm run build

# ---- Runtime ----
FROM node:18-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production
# Copy production node_modules from dependencies stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
# Copy built application from build stage
COPY --from=build /usr/src/app/dist ./dist
# Expose port (ensure this matches your application's listening port)
EXPOSE 3000
# Command to run the application
CMD [ "node", "dist/main.js" ]
