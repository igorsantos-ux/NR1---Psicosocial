FROM node:20-slim

WORKDIR /app

# Instalar dependências necessárias para o Prisma, LibreOffice e fontes
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    libreoffice-common \
    libreoffice-writer \
    fonts-liberation \
    libxml2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build do TypeScript
RUN npm run build

# Criar diretório de output
RUN mkdir -p output

EXPOSE 3001

CMD ["npm", "run", "start"]
