import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import testRoutes from './routes/test.js';
import chatRoutes from './routes/chat.js';
import sessionRoutes from './routes/session.js';
import { buildVectorStore } from './rag/vectorStore.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'hackathon-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));

app.use('/api', testRoutes);
app.use('/api', chatRoutes);
app.use('/api', sessionRoutes);

app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

buildVectorStore()
  .then(() => {
    console.log('✅ RAG system ready');
    app.listen(PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${PORT}`);
      console.log(`🧪 Test Gemini key at: http://localhost:${PORT}/api/test-gemini`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to build vector store:', err);
    process.exit(1);
  });
