FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
COPY . .
RUN npx prisma generate
RUN npx tsc -p tsconfig.build.json --skipLibCheck --noEmitOnError false
RUN ls -la dist/ && echo "Build successful!"

EXPOSE 10000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && (npx prisma db seed || echo 'Seed skipped or already run') && node dist/main"]
