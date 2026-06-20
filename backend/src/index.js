import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import testRoutes from './routes/test.js';

// Load environment variables from .env file


const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---

// Allow frontend (usually on port 5173 for Vite) to talk to backend
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true // Required for sessions to work across ports
}));

// Parse incoming JSON bodies
app.use(express.json());

// Session setup. 
// Note: express-session will warn you about MemoryStore in production. 
// Ignore it for the hackathon! It's perfect for a 10-hour demo.
app.use(session({
  secret: process.env.SESSION_SECRET || 'hackathon-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS in production
}));

// --- ROUTES ---

// Mount our test route under the /api prefix
app.use('/api', testRoutes);

// Future routes will go here:
// app.use('/api/chat', chatRoutes);
// app.use('/api/session', sessionRoutes);

// --- ERROR HANDLER ---

// Global error handling middleware (must have 4 arguments: err, req, res, next)
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  res.status(err.status || 500).json({ 
    success: false, 
    error: err.message || 'Internal Server Error' 
  });
});

// --- START SERVER ---

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
  console.log(`🧪 Test your Gemini key at: http://localhost:${PORT}/api/test-gemini`);
});