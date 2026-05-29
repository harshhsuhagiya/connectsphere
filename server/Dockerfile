FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm install pm2 -g
EXPOSE 5000
CMD ["pm2-runtime", "server.js"]
