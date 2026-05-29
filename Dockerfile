FROM node:22-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS pnpm

RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

FROM pnpm AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY . .
RUN DATABASE_URL="postgresql://user:password@localhost:5432/mydb" pnpm prisma generate
RUN pnpm build \
  && find dist -type f \( -name "*.map" -o -name "*.d.ts" -o -name "*.d.ts.map" \) -delete

FROM deps AS prod-deps

RUN pnpm prune --prod \
  && find node_modules -type f \( -name "*.map" -o -name "*.d.ts" -o -name "*.md" \) -delete

FROM base AS runtime

ENV NODE_ENV=production

COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 8000

CMD ["node", "dist/src/index.js"]
