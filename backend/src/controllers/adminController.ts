import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { DocumentModel } from '../models/Document';
import { DocumentChunk } from '../models/DocumentChunk';
import { AnalysisResult } from '../models/AnalysisResult';
import { ChatMessage } from '../models/ChatMessage';
import { SystemMetrics } from '../models/SystemMetrics';
import { logger } from '../utils/logger';
import { requireAuth, requireAdmin, getUserId } from '../utils/userAuth';
import { deleteFile } from '../services/storageService';
import { UpgradeRequest } from '../models/UpgradeRequest';
import { AdminChat } from '../models/AdminChat';
import { sendApprovalEmail, sendRejectionEmail } from '../services/emailService';

/**
 * GET /api/admin/metrics
 * Retrieve system metrics for user (authenticated users can view their own metrics)
 *
 * Type-safe: req.user is guaranteed to be RequestUser
 * Security: Users can only see their own metrics
 */
export const getSystemMetrics = requireAuth(async (req, res, next, user) => {
  try {
    const userId = getUserId(user);
    const isAdmin = user.role === 'admin';

    // 1. User/Platform specific counts
    const totalDocuments = await DocumentModel.countDocuments(isAdmin ? {} : { userId });
    const pendingUpgrades = isAdmin ? await User.countDocuments({ upgradeRequestStatus: 'pending' }) : 0;
    
    // 2. Dashboard Activity Chart
    const activityMatch = isAdmin ? {} : { userId: user._id };
    const last7Days = await DocumentModel.aggregate([
      { $match: { ...activityMatch, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } }
    ]);

    const requestsByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const found = last7Days.find(d => d.date === date);
      requestsByDay.push({
        date,
        count: found ? found.count : 0
      });
    }

    // 3. Admin-only Deep Insights
    let platformStats: any = null;
    if (isAdmin) {
      const userDistribution = await User.aggregate([
        { $group: { _id: "$planTier", count: { $sum: 1 } } }
      ]);
      
      const totalStorage = await DocumentModel.aggregate([
        { $group: { _id: null, total: { $sum: "$size" } } }
      ]);

      const totalAnalyses = await AnalysisResult.countDocuments({});
      const totalMessages = await ChatMessage.countDocuments({});
      const totalUsers = await User.countDocuments({});

      platformStats = {
        userDistribution,
        totalStorage: totalStorage[0]?.total || 0,
        totalAnalyses,
        totalMessages,
        totalUsers,
        activeUsersToday: await User.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
      };
    }

    res.json({
      totalDocuments,
      pendingUpgrades,
      apiRequestsLast24h: isAdmin ? platformStats?.totalMessages : 0, 
      requestsByDay,
      platformStats: isAdmin ? platformStats : undefined
    });
  } catch (error) {
    logger.error('[AdminController] Error calculating metrics:', error);
    next(error);
  }
});

/**
 * GET /api/admin/users
 * Admin-only: Retrieve all users in the system
 *
 * Type-safe: req.user is guaranteed to be RequestUser with role === 'admin'
 * Role-safe: Only admins can access this endpoint (enforced by requireAdmin)
 * Audit: Admin actions are logged automatically by requireAdmin
 */
export const getUsers = requireAdmin(async (req, res, next, admin) => {
  try {
    logger.info(`[AdminController] getAllUsers called by admin: ${admin.email}`);

    const users = await User.find().select('-__v').lean();

    res.json({ users, count: users.length });
  } catch (error) {
    logger.error(`[AdminController] Error fetching all users:`, error);
    next(error);
  }
});

/**
 * DELETE /api/admin/users/:id
 * Admin-only: Delete a user and their associated data
 *
 * Type-safe: req.user is guaranteed to be RequestUser with role === 'admin'
 * Role-safe: Only admins can access this endpoint (enforced by requireAdmin)
 * Audit: Admin actions are logged automatically by requireAdmin
 */
export const deleteUser = requireAdmin(async (req, res, next, admin) => {
  try {
    const userId = req.params.id;

    logger.info(`[AdminController] deleteUser called by admin: ${admin.email} for userId: ${userId}`);

    // Prevent self-deletion
    if (admin._id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all user's documents
    const userDocuments = await DocumentModel.find({ userId });

    // Delete files from storage
    for (const doc of userDocuments) {
      if (doc.storageUrl) {
        await deleteFile(doc.storageUrl);
      }
    }

    // Delete user's data in cascading order
    await DocumentChunk.deleteMany({ userId });
    await AnalysisResult.deleteMany({ userId });
    await ChatMessage.deleteMany({ userId });
    await DocumentModel.deleteMany({ userId });
    await SystemMetrics.deleteMany({ userId });

    // Finally delete the user
    await User.findByIdAndDelete(userId);

    logger.info(`[AdminController] User and all associated data deleted: ${user.email} (${userId}) by admin: ${admin.email}`);

    res.json({
      message: 'User and all associated data deleted successfully',
      deletedUser: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error(`[AdminController] Error deleting user ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * GET /api/admin/upgrade-requests
 * Admin-only: Retrieve all pending upgrade requests
 */
export const getUpgradeRequests = requireAdmin(async (req, res, next, admin) => {
  try {
    const requests = await UpgradeRequest.find({ status: 'pending' })
      .populate('userId', 'email name plan')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    logger.error('[AdminController] Error fetching upgrade requests:', error);
    next(error);
  }
});

/**
 * POST /api/admin/approve-upgrade/:requestId
 * Admin-only: Approve a premium upgrade request
 */
export const approveUpgrade = requireAdmin(async (req, res, next, admin) => {
  try {
    const { requestId } = req.params;
    const request = await UpgradeRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Upgrade request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is already processed' });
    }

    // Update request status
    request.status = 'approved';
    await request.save();

    // Update user plan
    const user = await User.findById(request.userId);
    if (user) {
      user.planTier = 'PRO';
      user.plan = 'PRO';
      user.upgradeRequestStatus = 'approved';
      user.paymentStatus = 'paid'; // Simulated payment approval
      await user.save();

      // Send approval email
      await sendApprovalEmail(user.email);
    }

    res.json({ message: 'Upgrade approved successfully', userEmail: user?.email });
  } catch (error) {
    logger.error('[AdminController] Error approving upgrade:', error);
    next(error);
  }
});

/**
 * POST /api/admin/reject-upgrade/:requestId
 * Admin-only: Reject a premium upgrade request
 */
export const rejectUpgrade = requireAdmin(async (req, res, next, admin) => {
  try {
    const { requestId } = req.params;
    const request = await UpgradeRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Upgrade request not found' });
    }

    // Update request status
    request.status = 'rejected';
    await request.save();

    // Update user status
    const user = await User.findById(request.userId);
    if (user) {
      user.upgradeRequestStatus = 'rejected';
      await user.save();

      // Send rejection email
      await sendRejectionEmail(user.email);
    }

    res.json({ message: 'Upgrade rejected successfully' });
  } catch (error) {
    logger.error('[AdminController] Error rejecting upgrade:', error);
    next(error);
  }
});

/**
 * GET /api/admin/chat-history/:userId
 * Admin-only: Retrieve chat history with a specific user
 */
export const getChatHistory = requireAdmin(async (req, res, next, admin) => {
  try {
    const { userId } = req.params;
    const history = await AdminChat.find({
      $or: [
        { senderId: admin._id, receiverId: userId },
        { senderId: userId, receiverId: admin._id }
      ]
    }).sort({ createdAt: 1 });

    res.json(history);
  } catch (error) {
    logger.error('[AdminController] Error fetching chat history:', error);
    next(error);
  }
});
