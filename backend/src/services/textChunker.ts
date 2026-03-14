import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const chunkText = async (text: string, chunkSize = 700, chunkOverlap = 150): Promise<string[]> => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const chunks = await splitter.createDocuments([text]);
  return chunks.map(chunk => chunk.pageContent);
};
