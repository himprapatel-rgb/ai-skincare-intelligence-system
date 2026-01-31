# Frontend Dockerfile - avoids Nixpacks npm cache EBUSY error
FROM node:20-slim AS builder

WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci

# Build (VITE_* from Railway env at build time)
COPY . .
ARG VITE_API_URL=https://ai-skincare-intelligence-system-production.up.railway.app/api/v1
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
RUN npm run build

# Production: serve static files
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY server.js ./
RUN npm install express

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
