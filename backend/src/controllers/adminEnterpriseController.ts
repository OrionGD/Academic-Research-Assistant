import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { AuditLog } from '../models/AuditLog';
import { SystemSettings } from '../models/SystemSettings';
import { logger } from '../utils/logger';
import { requireAdmin } from '../utils/userAuth';

/**
 * Audit Logging Helper
 */
const logAdminAction = async (admin: any, action: string, resource: string, resourceId?: string, details?: any) => {
  try {
    await AuditLog.create({
      userId: admin._id,
      userEmail: admin.email,
      action,
      resource,
      resourceId,
      details,
      ip: '', // Ideally from req.ip
      userAgent: '' // Ideally from req.headers['user-agent']
    });
  } catch (err) {
    logger.error('[AuditLog] Failed to create log:', err);
  }
};

// --- Project Management ---

export const getProjects = requireAdmin(async (req, res, next, admin) => {
  try {
    const projects = await Project.find()
      .populate('supervisors', 'name email')
      .populate('collaborators', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

export const createProject = requireAdmin(async (req, res, next, admin) => {
  try {
    const projectData = req.body;
    const project = await Project.create(projectData);
    await logAdminAction(admin, 'CREATE', 'Project', project._id.toString(), { name: project.name });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

export const updateProject = requireAdmin(async (req, res, next, admin) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, req.body, { new: true });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await logAdminAction(admin, 'UPDATE', 'Project', id, req.body);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

export const deleteProject = requireAdmin(async (req, res, next, admin) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await logAdminAction(admin, 'DELETE', 'Project', id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
});

// --- User Management Expansion ---

export const updateUserRole = requireAdmin(async (req, res, next, admin) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin', 'researcher', 'reviewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    await logAdminAction(admin, 'UPDATE_ROLE', 'User', id, { role });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// --- System Settings ---

export const getSettings = requireAdmin(async (req, res, next, admin) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

export const updateSettings = requireAdmin(async (req, res, next, admin) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    settings.updatedBy = new mongoose.Types.ObjectId(admin._id.toString());
    await settings.save();
    
    await logAdminAction(admin, 'UPDATE_SETTINGS', 'SystemSettings', settings._id.toString(), req.body);
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// --- Audit Logs ---

export const getAuditLogs = requireAdmin(async (req, res, next, admin) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    next(error);
  }
});
