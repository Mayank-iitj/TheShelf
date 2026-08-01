# Build stage for React frontend
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build stage for Node backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# better-sqlite3 requires python/make for alpine, but we can install production deps
RUN apk add --no-cache python3 make g++ 
RUN npm ci --only=production

COPY server/ ./server
COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
CMD ["npm", "run", "dev:server"]
