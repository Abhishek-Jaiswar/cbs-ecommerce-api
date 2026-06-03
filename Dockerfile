# ==========================================
# Stage 1: Build & Prune Dependencies
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

# Copy manifest files first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Generate Prisma Client & compile TypeScript
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm prisma generate
RUN pnpm build

# Prune devDependencies in-place, leaving only production packages in node_modules
RUN pnpm prune --prod

# ==========================================
# Stage 2: Ultra-lightweight Production Runner
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Set security best-practice non-root user
USER node

# Copy only the compiled JS, the production node_modules, and prisma schema
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/src/index.js"]