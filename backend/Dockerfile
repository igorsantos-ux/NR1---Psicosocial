FROM node:20-alpine

WORKDIR /app

# Instalar dependências necessárias para o Prisma/SQLite no Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build do TypeScript
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
