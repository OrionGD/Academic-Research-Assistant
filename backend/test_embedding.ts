
import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('API Key missing');

    const client = new GoogleGenerativeAI(apiKey);
    console.log('Testing with v1...');

    // Attempting to specify v1 for the model
    const model = client.getGenerativeModel({ model: 'gemini-embedding-001' }, { apiVersion: 'v1' });
    const result = await model.embedContent('Hello world');

    if (result.embedding && result.embedding.values) {
      console.log('Success! Embedding generated via v1.');
      console.log('Dimensions:', result.embedding.values.length);
    } else {
      console.log('Failed: result structure unexpected:', JSON.stringify(result));
    }
  } catch (err: any) {
    console.error('Test failed:', err.message || err);

    console.log('Trying with embedding-001 as fallback...');
    try {
      const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = client.getGenerativeModel({ model: 'gemini-embedding-001' });
      const result = await model.embedContent('Hello world');
      console.log('Success with embedding-001!');
    } catch (err2: any) {
      console.error('Fallback also failed:', err2.message || err2);
    }
  }
}

test();
