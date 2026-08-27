const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Essential when hosted behind reverse proxies (Render, Vercel, Nginx) so real user IPs are tracked
app.set('trust proxy', 1);

// Initialize Socket.io with production-ready CORS & WebSocket fallbacks
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// 1. High-Capacity General API Rate Limiter (Allows 3000 requests per 15 min per user/IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again in a few minutes.' }
});

// 2. Headroom Auth Limiter (Allows up to 100 login/register attempts per 5 min per user/IP)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please wait 5 minutes.' }
});

// Apply rate limiters
app.use('/api/auth/', authLimiter);
app.use('/api/', apiLimiter);

// In-memory cache for fast message retrieval per team room
const teamMessages = {};

// Socket.io Real-time Team Chat
io.on('connection', (socket) => {
  // Join squad chat room (Enforces 3-day message retention policy)
  socket.on('join_team', async ({ teamId, user }) => {
    if (!teamId) return;
    const tid = teamId.toString();
    socket.join(`team_${tid}`);
    socket.join(tid);
    
    try {
      const Message = require('./models/Message');
      const Team = require('./models/Team');
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      // Clean up any old array messages older than 3 days in Team document
      Team.findByIdAndUpdate(tid, {
        $pull: { messages: { createdAt: { $lt: threeDaysAgo } } }
      }).exec().catch(() => {});

      // Query valid messages created within the last 3 days
      const ttlMessages = await Message.find({
        teamId: tid,
        createdAt: { $gte: threeDaysAgo }
      }).sort({ createdAt: 1 }).lean();

      let dbMessages = ttlMessages.map(m => ({
        _id: m._id.toString(),
        teamId: tid,
        message: m.message,
        user: m.user,
        createdAt: m.createdAt.toISOString()
      }));

      // If Message collection empty, fallback to Team.messages filtered to 3-day window
      if (dbMessages.length === 0) {
        const teamDoc = await Team.findById(tid).select('messages').lean();
        dbMessages = (teamDoc?.messages || [])
          .filter(m => new Date(m.createdAt || Date.now()) >= threeDaysAgo)
          .map(m => ({
            _id: m._id ? m._id.toString() : `msg_${Date.now()}`,
            teamId: tid,
            message: m.message,
            user: m.user,
            createdAt: m.createdAt || new Date().toISOString()
          }));
      }

      socket.emit('initial_messages', dbMessages);
    } catch {
      if (teamMessages[`team_${tid}`]) {
        socket.emit('initial_messages', teamMessages[`team_${tid}`]);
      }
    }
  });

  // Send message to squad chat room (Saved to MongoDB FIRST, then emitted)
  socket.on('send_message', async ({ teamId, message, user }) => {
    if (!teamId || !message || !message.trim()) return;
    const tid = teamId.toString();
    const now = new Date();

    const senderData = {
      _id: user?._id || 'anonymous',
      name: user?.name || 'Teammate',
      email: user?.email || '',
      avatar: user?.avatar || user?.photoUrl || '',
      role: user?.primaryRole || user?.role || 'Member'
    };

    // 1. SAVE TO MONGODB FIRST BEFORE EMITTING
    try {
      const Message = require('./models/Message');
      const Team = require('./models/Team');

      const savedMsgDoc = await Message.create({
        teamId: tid,
        user: senderData,
        message: message.trim(),
        createdAt: now
      });

      await Team.findByIdAndUpdate(tid, {
        $push: {
          messages: {
            _id: savedMsgDoc._id,
            user: senderData,
            message: message.trim(),
            createdAt: now
          }
        }
      }).catch(() => {});

      const msgPayload = {
        _id: savedMsgDoc._id.toString(),
        teamId: tid,
        message: savedMsgDoc.message,
        user: savedMsgDoc.user,
        createdAt: savedMsgDoc.createdAt.toISOString()
      };

      // 2. EMIT SAVED MESSAGE IN REAL-TIME TO ALL CONNECTED SQUAD MEMBERS ACROSS BOTH ROOM ALIASES
      io.to(`team_${tid}`).to(tid).emit('receive_message', msgPayload);
    } catch (err) {
      console.error('Failed to save message to MongoDB before emit:', err);
    }
  });
});

app.get('/', (req, res) => {
  res.send('Homiee API with Socket.io is running...');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/requests', require('./routes/requests'));

// Global Error Handling Middleware (Guarantees no unhandled exception crashes server)
app.use((err, req, res, next) => {
  console.error('Unhandled Error Stack:', err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server & Socket.io running on port ${PORT}`));