FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

RUN npm install
RUN npx prisma generate

EXPOSE 8083

CMD ["npm", "run", "start"]
