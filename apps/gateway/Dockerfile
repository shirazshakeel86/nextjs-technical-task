FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build gateway

CMD ["node", "dist/apps/gateway/main"]