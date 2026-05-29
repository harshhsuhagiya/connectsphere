require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const setupSockets = require('./sockets/socketHandlers');

const { connectRedis } = require('./config/redisClient');

const PORT = process.env.PORT || 5000;

connectDB();
connectRedis();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

setupSockets(io);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
