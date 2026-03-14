import { searchSimilarChunks } from '../services/vectorSearchService';
import { callGeminiStream } from '../services/geminiService';
import { ChatMessage } from '../models/ChatMessage';
import mongoose from 'mongoose';
import { Response } from 'express';
import { setupSSEStream } from '../utils/sseStream';
import { logger } from '../utils/logger';

export const runRagChatPipeline = async (
  sessionId: string,
  userId: string,
  query: string,
  res: Response,
  options?: { documentIds?: string[] }
) => {
  try {
    const sse = setupSSEStream(res);
    const userObjId = new mongoose.Types.ObjectId(userId);
    const docObjIds = options?.documentIds?.map(id => new mongoose.Types.ObjectId(id));

    // Store user message
    const userMsg = new ChatMessage({
        sessionId,
        userId: userObjId,
        role: 'user',
        message: query
    });
    await userMsg.save();

    // Step 1-2: Vector Search
    const topChunks = await searchSimilarChunks(query, userObjId, docObjIds, 5);
    const contextText = topChunks.map(c => c.chunk.text).join('\n---\n');

    // Step 3: Construct prompt with history
    const history = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 }).limit(10);
    const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.message}`).join('\n');

    const prompt = `System Instruction: You are an AI Academic Research Assistant. Use the retrieved context to answer the user's query accurately. If the context doesn't contain the answer, say so. Do not invent information.

When using context, you MUST provide explicit citations using the chunk ID [Index <id>] whenever you reference an idea from it.

Retrieved Context:
${contextText}

Conversation History:
${historyText}

User Query:
${query}`;

    // Step 4 & 5: Call Gemini and Stream
    const stream = await callGeminiStream(prompt, 'gemini-3.1-pro');
    
    let fullResponse = '';

    for await (const chunk of stream) {
        const textChunk = chunk.text;
        fullResponse += textChunk;
        sse.send('message', { chunk: textChunk });
    }

    // Step 6: Store Assistant Response
    const contextObjIds = topChunks.map(c => c.chunk._id);
    const assistantMsg = new ChatMessage({
        sessionId,
        userId: userObjId,
        role: 'assistant',
        message: fullResponse,
        sources: contextObjIds
    });
    await assistantMsg.save();

    sse.close();
    logger.info(`RAG Chat pipeline finished for session: ${sessionId}`);

  } catch (error: any) {
    logger.error('RAG Chat Pipeline Error:', error);
    // Try to send error to client if headers are not already sent entirely closed
    if (!res.writableEnded) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: "An error occurred" })}\n\n`);
        res.end();
    }
  }
};
