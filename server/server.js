require("./dns-fix");
require("dotenv").config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Team = require('./models/Team');
const User = require('./models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Essential when hosted behind reverse proxies (Render, Vercel, Nginx)
app.set('trust proxy', 1);

// Initialize Socket.io with secure CORS
const io = new Server(server, {
    cors: {
        origin: "https://homiee-ajnj.vercel.app",
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server requests or local Postman testing
    if (!origin) return callback(null, true);

    // Allow local development and any .vercel.app domain
    if (origin.includes("localhost") || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// 1. High-Capacity General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again in a few minutes.' }
});

// 2. Auth Limiter
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please wait 5 minutes.' }
});

// Apply rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);
app.use('/api/', apiLimiter);

// Socket.io Strict JWT Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || 
    (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.split(' ')[1]);

  if (!token) {
    // Proceed as unauthenticated socket, but block access to protected team events
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    if (userId) {
      socket.user = {
        userId: userId.toString(),
        email: decoded.email
      };
    }
  } catch {
    // Invalid token
  }
  next();
});

// Socket.io Real-time Squad Chat
io.on('connection', (socket) => {
  // 1. Join squad chat room with verified membership authorization
  socket.on('join_team', async ({ teamId, token }) => {
    // If token passed in payload, verify if not already attached
    if (token && !socket.user?.userId) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        if (userId) {
          socket.user = {
            userId: userId.toString(),
            email: decoded.email
          };
        }
      } catch {
        // invalid
      }
    }

    const callerId = socket.user?.userId;
    if (!callerId) {
      socket.emit('error', { message: 'Authentication required to join squad chat.' });
      return;
    }

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) return;

    try {
      const teamDoc = await Team.findById(teamId).select('leader members messages').lean();
      if (!teamDoc) return;

      // Validate that verified user is either the leader or a confirmed member
      const isMember = (teamDoc.leader && teamDoc.leader.toString() === callerId) ||
        (Array.isArray(teamDoc.members) && teamDoc.members.some(m => m.toString() === callerId));

      if (!isMember) {
        socket.emit('error', { message: 'Access denied. Only confirmed squad members can access chat.' });
        return;
      }

      const room = `team_${teamId}`;
      socket.join(room);

      const dbMessages = (teamDoc.messages || []).slice(-100).map(m => ({
        _id: m._id ? m._id.toString() : `msg_${Date.now()}`,
        teamId,
        message: m.message,
        user: m.user,
        createdAt: m.createdAt || new Date().toISOString()
      }));

      socket.emit('initial_messages', dbMessages);
    } catch (err) {
      console.warn('Socket join_team error:', err.message);
    }
  });

  // 2. Send message to squad chat room with persistence and room broadcast
  socket.on('send_message', async ({ teamId, message, token }) => {
    if (token && !socket.user?.userId) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        if (userId) {
          socket.user = {
            userId: userId.toString(),
            email: decoded.email
          };
        }
      } catch {
        // invalid
      }
    }

    const callerId = socket.user?.userId;
    if (!callerId) {
      socket.emit('error', { message: 'Authentication required to send messages.' });
      return;
    }

    if (!teamId || !message || !String(message).trim() || !mongoose.Types.ObjectId.isValid(teamId)) return;

    try {
      const teamDoc = await Team.findById(teamId);
      if (!teamDoc) return;

      const isMember = (teamDoc.leader && teamDoc.leader.toString() === callerId) ||
        (Array.isArray(teamDoc.members) && teamDoc.members.some(m => m.toString() === callerId));

      if (!isMember) {
        socket.emit('error', { message: 'Only confirmed squad members can send messages.' });
        return;
      }

      const senderUser = await User.findById(callerId).select('name avatar photoUrl primaryRole email').lean();

      const msgPayload = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        teamId,
        message: String(message).trim(),
        user: {
          _id: callerId,
          name: senderUser?.name || 'Teammate',
          email: senderUser?.email || socket.user.email || '',
          avatar: senderUser?.avatar || senderUser?.photoUrl || '',
          role: senderUser?.primaryRole || 'Member'
        },
        createdAt: new Date().toISOString()
      };

      // Cap embedded messages array to most recent 100 messages
      if (teamDoc.messages && teamDoc.messages.length >= 100) {
        teamDoc.messages = teamDoc.messages.slice(-99);
      }

      teamDoc.messages.push({
        user: msgPayload.user,
        message: msgPayload.message,
        createdAt: new Date(msgPayload.createdAt)
      });
      await teamDoc.save();

      // Emit in real-time to all sockets in this squad room
      const room = `team_${teamId}`;
      io.to(room).emit('receive_message', msgPayload);
    } catch (err) {
      console.warn('Could not persist message to MongoDB:', err.message);
    }
  });
});

// Dedicated Production Healthcheck & Uptime Monitor
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[dbState] || 'unknown';

  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'healthy' : 'degraded',
    database: dbStatus,
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root Healthcheck
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Homiee SIH 2026 API with Socket.io is running...',
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/requests', require('./routes/requests'));

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err.message);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server & Socket.io running on port ${PORT}`));

// Graceful Shutdown
const gracefulShutdown = () => {
  console.log('Initiating graceful shutdown...');
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
