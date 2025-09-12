# Multi-stage build for Phase1 backend + static frontend
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app

# Install only phase1 backend (keep image lean)
COPY phase1/backend/package.json phase1/backend/package-lock.json* ./phase1/backend/
RUN cd phase1/backend && npm install --production=false

# Copy source
COPY phase1/backend/src ./phase1/backend/src
COPY phase1/frontend ./phase1/frontend

# Build typescript
RUN cd phase1/backend && npx tsc

# Runtime image
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copy built artifacts and minimal node_modules (prod)
COPY --from=base /app/phase1/backend/package.json ./phase1/backend/package.json
COPY --from=base /app/phase1/backend/node_modules ./phase1/backend/node_modules
COPY --from=base /app/phase1/backend/dist ./phase1/backend/dist
COPY --from=base /app/phase1/frontend ./phase1/frontend

# Create data directories
RUN mkdir -p /app/phase1/data/{uploads,extracted,demos,market-research}

EXPOSE 3001

# Simple start script (serve static frontend and API)
WORKDIR /app/phase1/backend
CMD ["node","dist/app.js"]
