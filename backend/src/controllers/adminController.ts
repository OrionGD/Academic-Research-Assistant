import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { SystemMetrics } from '../models/SystemMetrics';

export const getSystemMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real application, there would be a worker/cron job updating these metrics daily.
    // Here we just fetch the latest entry or return an empty state.
    const metrics = await SystemMetrics.find().sort({ date: -1 }).limit(30);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Also consider deleting user's documents from MongoDB and Storage
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
   next(error);
  }
};
