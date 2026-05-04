# ─── AquaOS Production Dockerfile ──────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first (caching layer)
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application code
COPY backend/src ./src

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
