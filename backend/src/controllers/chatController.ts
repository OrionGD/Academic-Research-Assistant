import { Request, Response, NextFunction } from 'express';
import { ChatMessage } from '../models/ChatMessage';
import { logger } from '../utils/logger';
import { requireAuth, getUserId } from '../utils/userAuth';

/**
 * POST /api/chat
 * Standard (non-streaming) RAG chat — delegates to the ML service.
 */
export const createChat = requireAuth(async (req, res, next, user) => {
  try {
    const { sessionId, message, documentId } = req.body;
    
    // Support legacy 'query' field if 'message' is missing
    const userPrompt = message || req.body.query;
    
    if (!sessionId || !userPrompt) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    const userId = getUserId(user);
    const payload: Record<string, any> = { message: userPrompt, userId };
    
    // Support legacy 'documentIds' or new 'documentId'
    const docs = documentId ? [documentId] : (req.body.documentIds || []);
    if (docs.length) payload.documentIds = docs;

    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const ML_SERVICE_API_KEY = process.env.ML_SERVICE_API_KEY || '';

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
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const chatResponse = await response.json();

    // Persist messages to MongoDB
    await Promise.all([
      new ChatMessage({
        sessionId,
        userId: user._id,
        role: 'user',
        message: userPrompt,
      }).save(),
      new ChatMessage({
        sessionId,
        userId: user._id,
        role: 'assistant',
        message: chatResponse.message?.content || '',
        sources: chatResponse.sources || [],
      }).save(),
    ]);

    res.json(chatResponse);
  } catch (error: any) {
    logger.error('[ChatController] Error:', error);
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ error: 'AI service timed out' });
    }
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

/**
 * POST /api/chat/stream
 * SSE streaming RAG chat — delegates to the ML service /chat/stream.
 */
export const streamChat = requireAuth(async (req, res, next, user) => {
  try {
    const { sessionId, message, documentId } = req.body;
    const userPrompt = message || req.body.query;

    if (!sessionId || !userPrompt) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    const userId = getUserId(user);

    // Save user message immediately
    await new ChatMessage({
      sessionId,
      userId: user._id,
      role: 'user',
      message: userPrompt,
    }).save();

    // Setup SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const docs = documentId ? [documentId] : (req.body.documentIds || []);
    const payload = { message: userPrompt, userId, documentIds: docs };

    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const ML_SERVICE_API_KEY = process.env.ML_SERVICE_API_KEY || '';

    const mlResponse = await fetch(`${ML_SERVICE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ML_SERVICE_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!mlResponse.ok) {
      logger.error(`[ChatController] ML stream error: ${mlResponse.status}`);
      res.write(`data: ${JSON.stringify({ error: 'AI service unavailable' })}\n\n`);
      res.end();
      return;
    }

    if (!mlResponse.body) throw new Error('No body in ML response');

    const reader = mlResponse.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      // Transform ML service 'chunk' format into 'text' format for frontend stability
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') {
            res.write(`data: [DONE]\n\n`);
            continue;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.chunk) {
              assistantMessage += parsed.chunk;
              // RE-EMIT as 'text' for useChat.ts compatibility
              res.write(`data: ${JSON.stringify({ text: parsed.chunk })}\n\n`);
            } else if (parsed.done) {
              // Pass through citations and metadata
              res.write(`data: ${dataStr}\n\n`);
            }
          } catch (e) {
            // Partial JSON or heartbeat
          }
        }
      }
    }

    // Persist assistant response
    if (assistantMessage) {
      await new ChatMessage({
        sessionId,
        userId: user._id,
        role: 'assistant',
        message: assistantMessage,
      }).save();
    }

    res.end();
  } catch (error: any) {
    logger.error('[StreamChat] Error:', error);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'AI service unavailable' })}\n\n`);
      res.end();
    }
  }
});

/**
 * GET /api/chat/history/:sessionId
 */
export const getChatHistory = requireAuth(async (req, res, next, user) => {
  try {
    const { sessionId } = req.params;
    const messages = await ChatMessage.find({ sessionId, userId: user._id })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Map database fields to frontend expected fields if necessary
    const formattedMessages = messages.map(m => ({
      id: m._id.toString(),
      role: m.role,
      content: m.message,
      timestamp: m.createdAt,
      citations: m.sources // Optionally map sources
    }));

    res.json(formattedMessages);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/chat/history/:sessionId
 */
export const deleteChatHistory = requireAuth(async (req, res, next, user) => {
  try {
    const { sessionId } = req.params;
    await ChatMessage.deleteMany({ sessionId, userId: user._id });
    res.json({ message: 'Chat history deleted' });
  } catch (error) {
    next(error);
  }
});

