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

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Rate Limiter: Max 200 requests per 15 minutes per IP address
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// In-memory cache for recent messages per team room
const teamMessages = {};

// Socket.io Real-time Team Chat
io.on('connection', (socket) => {
  // Join squad chat room
  socket.on('join_team', ({ teamId, user }) => {
    if (!teamId) return;
    const room = `team_${teamId}`;
    socket.join(room);
    
    // Send existing recent messages in this team room to the connected member
    if (teamMessages[room]) {
      socket.emit('initial_messages', teamMessages[room]);
    }
  });

  // Send message to squad chat room
  socket.on('send_message', ({ teamId, message, user }) => {
    if (!teamId || !message || !message.trim()) return;
    const room = `team_${teamId}`;
    const msgPayload = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      teamId,
      message: message.trim(),
      user: {
        _id: user?._id || 'anonymous',
        name: user?.name || 'Teammate',
        avatar: user?.avatar || '',
        role: user?.primaryRole || 'Member'
      },
      createdAt: new Date().toISOString()
    };

    if (!teamMessages[room]) {
      teamMessages[room] = [];
    }
    teamMessages[room].push(msgPayload);
    // Keep max 100 recent messages per room
    if (teamMessages[room].length > 100) {
      teamMessages[room].shift();
    }

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