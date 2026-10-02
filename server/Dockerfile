FROM node:22-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY src/package*.json ./
RUN npm ci --omit=dev
COPY src ./
EXPOSE 4000
CMD ["node", "server.js"]
