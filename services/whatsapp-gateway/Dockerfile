FROM node:22-alpine

WORKDIR /app

# Installation des dépendances système légères
RUN apk add --no-cache git python3 make g++

# Copie des définitions de paquets
COPY package.json ./

# Installation propre des dépendances npm
RUN npm install --omit=dev

# Copie du code source et de la session WhatsApp authentifiée
COPY server.js ./
COPY auth/ /app/auth/

RUN chown -R 1000:1000 /app

USER 1000

ENV PORT=10000
ENV AUTH_DIR=/app/auth

EXPOSE 10000

CMD ["node", "server.js"]
