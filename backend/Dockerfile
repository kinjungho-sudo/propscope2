FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
COPY . .
RUN npx prisma generate

# Remove any stale build info and rebuild
RUN rm -f tsconfig.build.tsbuildinfo && npm run build

# Verify build output
RUN ls -la dist/ && test -f dist/main.js && echo "=== dist/main.js EXISTS ===" || (echo "=== DIST MISSING, trying direct tsc ===" && npx tsc -p tsconfig.build.json --noEmitOnError false && ls -la dist/)

EXPOSE 10000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && (npx prisma db seed || echo 'Seed skipped or already run') && node dist/main"]
