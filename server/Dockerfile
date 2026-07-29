FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN mkdir -p uploads

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
