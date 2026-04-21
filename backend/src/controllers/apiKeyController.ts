import { Request, Response } from 'express';
import { generateApiKey, listApiKeys, revokeApiKey } from '../services/apiKeyService';
import { logger } from '../utils/logger';

// ─── POST /api/keys ──────────────────────────────────────────────────────────
export const createKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Key name is required' });
    }

    const result = await generateApiKey(userId, name.trim());

    res.status(201).json({
      message: 'API key created. Copy it now — it will not be shown again.',
      key: result.rawKey,
      prefix: result.prefix,
      name: result.name,
    });
  } catch (error: any) {
    logger.error('[ApiKey] Create error:', error);
    res.status(400).json({ error: error.message || 'Failed to create API key' });
  }
};

// ─── GET /api/keys ───────────────────────────────────────────────────────────
export const getKeys = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const keys = await listApiKeys(userId);
    res.json({ keys });
  } catch (error: any) {
    logger.error('[ApiKey] List error:', error);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
};

// ─── DELETE /api/keys/:prefix ────────────────────────────────────────────────
export const deleteKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { prefix } = req.params;
    const revoked = await revokeApiKey(userId, prefix);

    if (!revoked) {
      return res.status(404).json({ error: 'API key not found or already revoked' });
    }

    res.json({ message: 'API key revoked successfully' });
  } catch (error: any) {
    logger.error('[ApiKey] Revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
};
