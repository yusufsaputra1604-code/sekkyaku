FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "src/index.js"]
