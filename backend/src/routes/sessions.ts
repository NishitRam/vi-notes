import express from 'express';
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';

const router = express.Router();

// Middleware to verify JWT
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        userId = decoded.userId;
      } catch (err) {
        // Invalid token is okay in guest mode
      }
    }

    const { content, keystrokes, pasteEvents } = req.body;
    const session = new Session({
      userId,
      content,
      keystrokes,
      pasteEvents
    });
    await session.save();
    res.status(201).json({ message: 'Session saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save session' });
  }
});

router.get('/', authenticate, async (req: any, res: any) => {
  try {
    const sessions = await Session.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

export default router;
