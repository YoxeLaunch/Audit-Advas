FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar archivos fuente y compilar bundle frontend optimizado
COPY . .
RUN npm run build

# Etapa final de producción optimizada
FROM node:22-alpine

WORKDIR /app

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copiar backend y bundle compilado
COPY server/ ./server/
COPY --from=builder /app/dist ./dist

# Persistencia de base de datos interna SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "--experimental-sqlite", "server/index.js"]

