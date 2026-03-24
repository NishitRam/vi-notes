import mongoose from 'mongoose';

const keystrokeSchema = new mongoose.Schema({
  key: String,
  pressTime: Number,
  releaseTime: Number,
  duration: Number,
  gap: Number // Time since last key release
});

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  content: { type: String, required: true },
  keystrokes: [keystrokeSchema],
  pasteEvents: [{
    timestamp: Number,
    textLength: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Session', sessionSchema);
