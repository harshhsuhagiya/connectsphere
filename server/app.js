const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const fileRoutes = require('./routes/fileRoutes');
const userRoutes = require('./routes/userRoutes');

require('./config/passport');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms/:roomId/files', fileRoutes);

app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Not found' }));
app.use((err, req, res, next) => res.status(500).json({ success: false, message: err.message }));

module.exports = app;
