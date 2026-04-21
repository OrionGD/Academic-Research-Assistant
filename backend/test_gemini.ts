import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { callGeminiStructured } from './src/services/geminiService';
import { logger } from './src/utils/logger';

async function testGemini() {
  const schema = {
    type: "object",
    properties: {
      summary: { type: "string" },
      keyInsights: { 
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["summary", "keyInsights"]
  };

  const prompt = "Summarize the benefits of AI in research and provide 3 key insights.";

  console.log('Testing Gemini Structured Output...');
  try {
    const result = await callGeminiStructured(prompt, schema);
    console.log('SUCCESS: Gemini returned structured output:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('FAILED: Gemini Structured Output Error:', error);
    process.exit(1);
  }
}

testGemini();
