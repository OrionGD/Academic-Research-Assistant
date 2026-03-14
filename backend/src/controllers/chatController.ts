import { Request, Response, NextFunction } from 'express';
import { ChatMessage } from '../models/ChatMessage';
import { runRagChatPipeline } from '../pipelines/ragChat.pipeline';

export const createChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, query, documentIds } = req.body;
    if (!sessionId || !query) {
       return res.status(400).json({ error: 'sessionId and query are required' });
    }

    // This is simply a synchronous or short polled version if we didn't use streaming.
    // For streaming, see streamChat below.
    // Assuming prompt instruction doesn't specify two distinct chat POST endpoints with same functionality,
    // we return advice to use SSE stream.
    res.status(400).json({ error: 'Please use /chat/stream for conversational capabilities.' });

  } catch (error) {
    next(error);
  }
};

export const streamChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, query, documentIds } = req.body;
    if (!sessionId || !query) {
       res.status(400).json({ error: 'sessionId and query are required' });
       return;
    }

    await runRagChatPipeline(sessionId, req.user._id.toString(), query, res, { documentIds });

  } catch (error) {
    next(error);
  }
};

export const deleteChatHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    await ChatMessage.deleteMany({ sessionId, userId: req.user._id });

    res.json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    next(error);
  }
};
