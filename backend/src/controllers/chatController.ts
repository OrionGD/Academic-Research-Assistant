import { Request, Response, NextFunction } from 'express';
import { ChatMessage } from '../models/ChatMessage';
import { runRagChatPipeline } from '../pipelines/ragChat.pipeline';
import { logger } from '../utils/logger';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SERVICE_API_KEY = process.env.ML_SERVICE_API_KEY || '';

/**
 * POST /api/chat
 * Standard (non-streaming) RAG chat — delegates to the ML service.
 */
export const createChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, query, documentIds } = req.body;
    if (!sessionId || !query) {
      return res.status(400).json({ error: 'sessionId and query are required' });
    }

    const userId = req.user._id.toString();

    const payload: Record<string, any> = { message: query, userId };
    if (documentIds?.length) payload.documentIds = documentIds;

    const response = await fetch(`${ML_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ML_SERVICE_API_KEY,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error(`[ChatController] ML service error: ${response.status} ${err}`);
      return res.status(502).json({ error: 'Chat service unavailable' });
    }

    const chatResponse = await response.json();

    // Persist messages to MongoDB for conversation history
    await Promise.all([
      new ChatMessage({
        sessionId,
        userId: req.user._id,
        role: 'user',
        message: query,
      }).save(),
      new ChatMessage({
        sessionId,
        userId: req.user._id,
        role: 'assistant',
        message: chatResponse.message?.content || '',
      }).save(),
    ]);

    res.json(chatResponse);
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ error: 'Chat service timed out' });
    }
    next(error);
  }
};

/**
 * POST /api/chat/stream
 * SSE streaming RAG chat — uses the Node.js RAG pipeline for real-time streaming.
 */
export const streamChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, query, documentIds } = req.body;
    if (!sessionId || !query) {
      res.status(400).json({ error: 'sessionId and query are required' });
      return;
    }

    // Use the Node.js RAG pipeline for SSE streaming (Gemini streams natively in Node)
    await runRagChatPipeline(sessionId, req.user._id.toString(), query, res, {
      documentIds,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/history/:sessionId
 * Retrieve conversation history for a session.
 */
export const getChatHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

    const messages = await ChatMessage.find({ sessionId, userId: req.user._id })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    res.json({ sessionId, messages, count: messages.length });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/chat/history/:sessionId
 * Delete all messages for a chat session.
 */
export const deleteChatHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const result = await ChatMessage.deleteMany({ sessionId, userId: req.user._id });
    res.json({ message: 'Chat history deleted', deletedCount: result.deletedCount });
  } catch (error) {
    next(error);
  }
};
