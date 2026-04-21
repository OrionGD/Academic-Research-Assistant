import { Request, Response, NextFunction } from 'express';
import { SupportMessage } from '../models/SupportMessage';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { requireAuth, getUserId, requireAdmin } from '../utils/userAuth';
import { getIo } from '../utils/socketService';

/**
 * Send a message to support (User side)
 */
export const sendMessage = requireAuth(async (req, res, next, user) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message content is required' });

    // In a single-thread per user system, the receiver is conceptually 'admin'
    // We'll use a placeholder or specifically find an admin if needed, 
    // but typically we'll just flag it for all admins.
    // For now, let's find the first admin for the receiverId field or leave a system ID.
    const admin = await User.findOne({ role: 'admin' });
    const receiverId = admin?._id;

    const newMessage = await SupportMessage.create({
      senderId: user._id,
      receiverId: receiverId || user._id, // fallback if no admin yet
      senderRole: 'user',
      message,
      status: 'unread'
    });

    // Real-time notification to admins
    const io = getIo();
    if (io) {
      io.to('admin_room').emit('new_support_message', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
});

/**
 * Get support chat history
 * - User side: only their own
 * - Admin side: history for a specific userId
 */
export const getHistory = requireAuth(async (req, res, next, user) => {
  try {
    let targetUserId = user._id;

    // If admin, they can request a specific userId's history
    if (user.role === 'admin' && req.query.userId) {
      targetUserId = req.query.userId as any;
    }

    const messages = await SupportMessage.find({
      $or: [
        { senderId: targetUserId },
        { receiverId: targetUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

/**
 * Reply to a user (Admin side)
 */
export const adminReply = requireAdmin(async (req, res, next, admin) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).json({ error: 'userId and message are required' });

    const newMessage = await SupportMessage.create({
      senderId: admin._id,
      receiverId: userId,
      senderRole: 'admin',
      message,
      status: 'unread'
    });

    // Mark user's previous unread messages as read when admin replies
    await SupportMessage.updateMany(
      { senderId: userId, receiverId: admin._id, status: 'unread' },
      { $set: { status: 'read' } }
    );

    // Real-time notification to the specific user
    const io = getIo();
    if (io) {
      io.to(userId.toString()).emit('receive_support_message', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
});

/**
 * Get all active support conversations (Admin side)
 */
export const getAdminInbox = requireAdmin(async (req, res, next, admin) => {
  try {
    // Get unique userIds who have messaged support
    const userIds = await SupportMessage.distinct('senderId', { senderRole: 'user' });
    
    // For each user, get the last message and unread count
    const conversations = await Promise.all(userIds.map(async (uid) => {
      const user = await User.findById(uid).select('name email avatar planTier');
      const lastMessage = await SupportMessage.findOne({
        $or: [{ senderId: uid }, { receiverId: uid }]
      }).sort({ createdAt: -1 });
      
      const unreadCount = await SupportMessage.countDocuments({
        senderId: uid,
        status: 'unread'
      });

      return {
        user,
        lastMessage,
        unreadCount
      };
    }));

    res.json(conversations.sort((a, b) => 
      (b.lastMessage?.createdAt?.getTime() || 0) - (a.lastMessage?.createdAt?.getTime() || 0)
    ));
  } catch (error) {
    next(error);
  }
});

/**
 * Mark a conversation as read (Admin side)
 */
export const markAsRead = requireAdmin(async (req, res, next, admin) => {
  try {
    const { userId } = req.params;
    await SupportMessage.updateMany(
      { senderId: userId, status: 'unread' },
      { $set: { status: 'read' } }
    );
    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    next(error);
  }
});
