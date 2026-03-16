import { searchSimilarChunks } from '../services/vectorSearchService';
import { callGeminiStream } from '../services/geminiService';
import { ChatMessage } from '../models/ChatMessage';
import mongoose from 'mongoose';
import { Response } from 'express';
import { setupSSEStream } from '../utils/sseStream';
import { logger } from '../utils/logger';

// Token budget: roughly 4 chars per token, keep context under 6000 tokens
const MAX_CONTEXT_CHARS = 24000;
const MAX_HISTORY_MESSAGES = 10;

export const runRagChatPipeline = async (
  sessionId: string,
  userId: string,
  query: string,
  res: Response,
  options?: { documentIds?: string[] }
) => {
  try {
    const sse = setupSSEStream(res);
    if (!mongoose.isValidObjectId(userId)) throw new Error('Invalid userId provided');
    const userObjId = new mongoose.Types.ObjectId(userId);
    const docObjIds = options?.documentIds
      ?.filter(id => mongoose.isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));

    // Store user message
    await new ChatMessage({
      sessionId,
      userId: userObjId,
      role: 'user',
      message: query,
    }).save();

    // Step 1: Retrieve relevant chunks via vector search
    const topChunks = await searchSimilarChunks(query, userObjId, docObjIds, 7);

    // Step 2: Token-budget the context (deduplicate + truncate)
    const seenChunks = new Set<string>();
    let contextChars = 0;
    const selectedChunks = topChunks.filter(c => {
      const key = `${c.chunk.documentId}:${c.chunk.chunkIndex}`;
      if (seenChunks.has(key)) return false;
      seenChunks.add(key);
      const charsNeeded = (c.chunk.chunkText || '').length;
      if (contextChars + charsNeeded > MAX_CONTEXT_CHARS) return false;
      contextChars += charsNeeded;
      return true;
    });

    const contextText = selectedChunks
      .map((c, i) => `[Source ${i + 1} | DocID: ${c.chunk.documentId} | Chunk: ${c.chunk.chunkIndex}]\n${c.chunk.chunkText}`)
      .join('\n\n---\n\n');

    // Step 3: Build conversation history
    const history = await ChatMessage
      .find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(MAX_HISTORY_MESSAGES);
    
    const historyText = history
      .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.message}`)
      .join('\n');

    const prompt = `You are ARAS — an AI Academic Research Assistant. Use the retrieved document context to answer the user accurately.

Instructions:
- Always cite sources using [Source N] notation when referencing specific information.
- If the context doesn't contain the answer, say so clearly — do NOT fabricate information.
- Be concise but thorough. Format lists and key points clearly.

Retrieved Context:
${contextText || 'No relevant context was found for this query.'}

Conversation History:
${historyText || 'No prior conversation.'}

User Query: ${query}`;

    // Step 4: Call Gemini 1.5 Flash and stream response
    const stream = await callGeminiStream(prompt, 'gemini-1.5-flash');
    let fullResponse = '';

    for await (const chunk of stream) {
      const textChunk = chunk.text;
      if (textChunk) {
        fullResponse += textChunk;
        sse.send('message', { chunk: textChunk });
      }
    }

    // Step 5: Build citation list
    const citations = selectedChunks.map((c, i) => ({
      index: i + 1,
      documentId: c.chunk.documentId?.toString(),
      chunkIndex: c.chunk.chunkIndex,
      score: Math.round(c.score * 100) / 100,
    }));

    sse.send('done', { citations });

    // Step 6: Persist assistant message
    const contextObjIds = selectedChunks
      .map(c => c.chunk._id)
      .filter((id): id is mongoose.Types.ObjectId => id != null);

    await new ChatMessage({
      sessionId,
      userId: userObjId,
      role: 'assistant',
      message: fullResponse,
      sources: contextObjIds,
    }).save();

    sse.close();
    logger.info(`RAG chat complete for session: ${sessionId}, chunks used: ${selectedChunks.length}`);

  } catch (error: any) {
    logger.error('RAG Chat Pipeline Error:', error);
    if (!res.writableEnded) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'RAG pipeline error', detail: error.message })}\n\n`);
      res.end();
    }
  }
};
