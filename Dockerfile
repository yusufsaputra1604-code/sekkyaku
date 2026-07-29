FROM node:20-bullseye

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

RUN cd server && ./node_modules/.bin/prisma generate

RUN mkdir -p server/uploads

EXPOSE 5000

WORKDIR /app/server

CMD ["node", "src/index.js"]
