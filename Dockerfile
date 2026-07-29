FROM node:20-alpine

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

RUN cd server && npx prisma generate

RUN chmod +x server/start.sh
RUN mkdir -p server/uploads

EXPOSE 5000

CMD ["sh", "server/start.sh"]
