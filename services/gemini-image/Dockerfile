FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV GEMINI_IMAGE_PORT=3010

EXPOSE 3010

CMD ["node", "server.js"]
