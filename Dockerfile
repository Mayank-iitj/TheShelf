# ─── Stage 1: Build React frontend ───────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
# Pass the Render backend URL at build time so Vite bakes it into the bundle
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ─── Stage 2: Production backend ──────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Install native build tools required by better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# Rebuild better-sqlite3 native bindings for this alpine node version
RUN npm rebuild better-sqlite3

COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

# Persistent SQLite data directory
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Seed the database before starting the server on first run.
# If the DB already exists, seed scripts are idempotent.
CMD node server/seed/seedContent.js || true && \
    node server/seed/seedHistory.js || true && \
    node server/index.js
