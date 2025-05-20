# ---- Base Node ----
FROM node:18-alpine AS base
WORKDIR /usr/src/app
# Install global dependencies for Nx if needed for build (example)
# RUN npm install -g nx

# ---- Dependencies ----
FROM base AS dependencies
# Copy workspace package.json and lock file
COPY ../../package.json ../../package-lock.json* ./
# RUN npm ci --omit=dev --ignore-scripts
# Copy API specific package.json (if it has its own dependencies not in workspace)
COPY package.json package-lock.json* ./apps/api/
WORKDIR /usr/src/app/apps/api
RUN npm install --omit=dev --ignore-scripts
# Or, if all dependencies are at the root for Nx:
WORKDIR /usr/src/app
RUN npm ci --omit=dev --ignore-scripts # Make sure this installs apps/api dependencies too

# ---- Build ----
FROM base AS build
WORKDIR /usr/src/app
# Copy dependency installation from previous stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --from=dependencies /usr/src/app/apps/api/node_modules ./apps/api/node_modules
# Copy entire monorepo source for build context (Nx might need this)
COPY ../../. ./
# Set NODE_ENV to production for build optimizations
ENV NODE_ENV=production
# Build the API application (adjust if your build command is different)
# This assumes an Nx setup. If not using Nx, you might use 'npm run build' from apps/api
RUN npx nx build api --prod

# ---- Runtime ----
FROM node:18-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production
# Copy built application from build stage
COPY --from=build /usr/src/app/dist/apps/api ./
# Copy production node_modules from dependencies stage
# This needs careful handling based on where Nx places final node_modules for the app
# Option 1: If build output includes node_modules
# COPY --from=build /usr/src/app/dist/apps/api/node_modules ./node_modules
# Option 2: If API has its own package.json and node_modules were installed there
COPY --from=dependencies /usr/src/app/apps/api/node_modules ./node_modules
# Option 3: If all node_modules are at the root and shared (more common in Nx for prod)
# This requires ensuring only necessary prod dependencies are packaged.
# A common Nx approach is to generate a package.json in the dist folder.
# For now, let's assume the build output in dist/apps/api is self-contained or we copy root node_modules.
# This part is tricky with Nx and might need adjustment.
# A safer bet for now if dist/apps/api doesn't have its own node_modules:
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Expose port (ensure this matches your application's listening port)
EXPOSE 3000
# Healthcheck (optional but good practice)
# HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "node", "healthcheck.js" ] # Requires a healthcheck script
# Command to run the application
CMD [ "node", "main.js" ]
