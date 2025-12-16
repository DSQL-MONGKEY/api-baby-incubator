# ----- Base Image
FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# activate corepack + pnpm
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

# ----- Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./

# copy prisma generated
COPY prisma ./prisma

# install all dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# generate prisma client
RUN pnpm prisma generate || true

# ----- Build
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build


# ----- Runtime minimal
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8201

# copy build artifact & prod deps
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

EXPOSE 8201
CMD ["node", "dist/src/main.js"]
