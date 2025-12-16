#!/bin/sh
set -e

echo "[entrypoint] preparing database (migrate/generate/seed)…"

if [ -d "./prisma" ]; then
   # Jalankan Prisma via bin langsung (aman untuk pnpm)
   node ./node_modules/.bin/prisma migrate deploy
   node ./node_modules/.bin/prisma generate

   # Seed kalau file compiled ada
   if [ -f "./dist/src/prisma/seed.js" ]; then
      echo "[entrypoint] running seed…"
      node ./dist/src/prisma/seed.js || true
   fi
fi

echo "[entrypoint] starting app on port ${PORT:-8201}…"
exec node ./dist/src/main.js
