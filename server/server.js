const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Rate Limiter: Max 100 requests per 15 minutes per IP address
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

app.get('/', (req, res) => {
  res.send('Homiee API is running...');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/teams', require('./routes/teams'));

// Global Error Handling Middleware (Guarantees no unhandled exception crashes server)
app.use((err, req, res, next) => {
  console.error('Unhandled Error Stack:', err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));