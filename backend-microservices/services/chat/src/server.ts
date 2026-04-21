import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import cors from 'cors';
import { Message } from './models/Message';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://aras_rag:aras_rag192607@aras.jnqzklv.mongodb.net/aras_chat?appName=ARAS';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

const setupSocket = async () => {
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    console.log(`[ChatService] Socket connected: ${socket.id}`);

    socket.on('join_room', (userId) => {
      socket.join(userId);
      console.log(`[ChatService] User ${userId} joined room`);
    });

    socket.on('send_message', async (data) => {
      const { senderId, receiverId, message } = data;
      try {
        const savedMsg = await Message.create({ senderId, receiverId, message });
        io.to(receiverId).emit('receive_message', savedMsg);
        io.to(senderId).emit('message_sent', savedMsg);
      } catch (err) {
        console.error('[ChatService] Error saving message:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[ChatService] Socket disconnected: ${socket.id}`);
    });
  });
};

// 🧪 Health Check
app.get('/health', (req, res) => {
  res.json({ service: 'chat-service', status: 'healthy', timestamp: new Date().toISOString() });
});

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    await setupSocket();
    httpServer.listen(PORT, () => {
      console.log(`✓ Chat Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Chat Service failure:', error);
    process.exit(1);
  }
};

start();
