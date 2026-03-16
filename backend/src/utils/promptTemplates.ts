export const promptTemplates = {
  analysisPrompt: (text: string) => `Analyze the following academic research paper text and extract the requested fields. Ensure you generate key insights, methodology, limitations, and potential future work.

Paper Text:
${text}`,

  ragChatPrompt: (contextText: string, historyText: string, query: string) => `System Instruction: You are an AI Academic Research Assistant. Use the retrieved context to answer the user's query accurately. If the context doesn't contain the answer, say so. Do not invent information.

When using context, you MUST provide citations pointing to the specific document chunk index/ID if available in the text.

Retrieved Context:
${contextText}

Conversation History:
${historyText}

User Query:
${query}`,

  comparisonPrompt: (docsText: string) => `Compare the following academic research papers based on their analysis data. Identify shared themes, methodological differences, conflicting results, and an overall conclusion.

Data:
${docsText}`,

  semanticSearchRerankPrompt: (query: string, chunksText: string) => `You are a search ranking assistant. Analyze the user's query and the retrieved document chunks. Determine how relevant each chunk is to the query and provide a brief reasoning. Return an array of the indices and their relevance reason.

Query: ${query}

Chunks:
${chunksText}`,
};
