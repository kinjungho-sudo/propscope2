FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 10000

CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node dist/main"]
