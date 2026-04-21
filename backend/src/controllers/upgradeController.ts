import { Request, Response } from 'express';
import { User } from '../models/User';
import { UpgradeRequest } from '../models/UpgradeRequest';
import { sendUpgradeRequestEmail } from '../services/emailService';
import { logger } from '../utils/logger';

/**
 * Submit an upgrade request
 */
export const requestUpgrade = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { message } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Check if there is already a pending request
    const existingUser = await User.findById(userId);
    if (!existingUser) return res.status(404).json({ error: 'User not found' });
    
    if (existingUser.upgradeRequestStatus === 'pending') {
      return res.status(400).json({ error: 'Upgrade request already pending' });
    }

    // Create request document
    const request = await UpgradeRequest.create({
      userId,
      message,
      status: 'pending'
    });

    // Update user status
    existingUser.upgradeRequestStatus = 'pending';
    await existingUser.save();

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@aras.ai';
    await sendUpgradeRequestEmail(adminEmail, existingUser.email, message);

    res.status(201).json({ 
      message: 'Upgrade request submitted successfully',
      request 
    });
  } catch (error) {
    logger.error('Upgrade Request Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user's current request status
 */
export const getRequestStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const request = await UpgradeRequest.findOne({ userId }).sort({ createdAt: -1 });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
