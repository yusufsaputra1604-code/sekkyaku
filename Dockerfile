FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm install
RUN cd client && npm install
RUN cd server && npm install

COPY client ./client/
RUN cd client && npm run build

COPY server ./server/

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/server/package*.json ./
RUN npm install --production

COPY --from=builder /app/server/prisma ./prisma/
RUN npx prisma generate

COPY --from=builder /app/server/src ./src/
COPY --from=builder /app/client/dist ./client/dist/

RUN mkdir -p uploads

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
