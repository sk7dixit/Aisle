# ==========================================
# Stage 1: Build & Dependencies installer
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build tools if native dependencies need compiling
RUN apk add --no-cache python3 make g++

# Copy packaging details
COPY package.json package-lock.json ./

# Install all dependencies including devDependencies (needed for audits/testing)
RUN npm ci

# Copy application files
COPY . .

# ==========================================
# Stage 2: Runtime Production Image
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=5000

# Copy package descriptors
COPY package.json package-lock.json ./

# Install only production dependencies securely
RUN npm ci --omit=dev && npm cache clean --force

# Copy only runtime code from build stage (ignoring test scripts and dev modules)
COPY --from=builder /usr/src/app/backend ./backend

# Enforce secure file permissions: node user ownership
RUN chown -R node:node /usr/src/app

# Switch container process user to non-privileged 'node' user (Least Privilege)
USER node

EXPOSE 5000

# Health check setup to verify process integrity at runtime
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/health').then(r => r.status === 200 ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "backend/server.js"]
