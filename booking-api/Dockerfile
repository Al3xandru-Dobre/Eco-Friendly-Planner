FROM node:22-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY scripts ./scripts
EXPOSE 5000
CMD ["node", "src/index.js"]
