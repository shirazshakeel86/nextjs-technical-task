FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build authentication

CMD ["node", "dist/apps/authentication/main"]