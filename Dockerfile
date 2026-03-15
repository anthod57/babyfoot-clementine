# ========== Stage 1: Build frontend ==========
FROM node:20-alpine AS front-builder
WORKDIR /app/front
COPY front/package.json front/package-lock.json* ./
RUN npm ci
COPY front/ .
# API relative to same origin when served by backend
ENV VITE_API_URL=/v1
RUN npm run build

# ========== Stage 2: Build backend ==========
FROM node:20-alpine AS back-builder
WORKDIR /app/back
COPY back/package.json back/package-lock.json ./
RUN npm ci
COPY back/ .
RUN npm run build

# ========== Stage 3: Production image ==========
FROM node:20-alpine
WORKDIR /app

COPY back/package.json back/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=back-builder /app/back/dist ./dist
COPY --from=front-builder /app/front/dist ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.js"]
