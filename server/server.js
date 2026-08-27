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

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
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
  // Join squad chat room
  socket.on('join_team', async ({ teamId, user }) => {
    if (!teamId) return;
    const room = `team_${teamId}`;
    socket.join(room);
    
    try {
      const Team = require('./models/Team');
      const teamDoc = await Team.findById(teamId).select('messages').lean();
      const dbMessages = (teamDoc?.messages || []).map(m => ({
        _id: m._id ? m._id.toString() : `msg_${Date.now()}`,
        teamId,
        message: m.message,
        user: m.user,
        createdAt: m.createdAt || new Date().toISOString()
      }));
      socket.emit('initial_messages', dbMessages);
    } catch {
      if (teamMessages[room]) {
        socket.emit('initial_messages', teamMessages[room]);
      }
    }
  });

  // Send message to squad chat room
  socket.on('send_message', async ({ teamId, message, user }) => {
    if (!teamId || !message || !message.trim()) return;
    const room = `team_${teamId}`;
    const msgPayload = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      teamId,
      message: message.trim(),
      user: {
        _id: user?._id || 'anonymous',
        name: user?.name || 'Teammate',
        avatar: user?.avatar || user?.photoUrl || '',
        role: user?.primaryRole || user?.role || 'Member'
      },
      createdAt: new Date().toISOString()
    };

    // 1. Save to MongoDB
    try {
      const Team = require('./models/Team');
      await Team.findByIdAndUpdate(teamId, {
        $push: {
          messages: {
            user: msgPayload.user,
            message: msgPayload.message,
            createdAt: new Date(msgPayload.createdAt)
          }
        }
      });
    } catch (err) {
      console.warn('Could not persist message to MongoDB:', err.message);
    }

    // 2. Cache in memory
    if (!teamMessages[room]) {
      teamMessages[room] = [];
    }
    teamMessages[room].push(msgPayload);
    if (teamMessages[room].length > 100) {
      teamMessages[room].shift();
    }

    // 3. Emit in real-time to all connected sockets in this squad room
    io.to(room).emit('receive_message', msgPayload);
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