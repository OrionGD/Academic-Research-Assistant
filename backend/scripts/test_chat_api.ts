
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SERVICE_API_KEY = process.env.ML_SERVICE_API_KEY;

async function testBackendToML() {
  console.log('--- Starting Backend -> ML Service Integration Test ---');
  console.log(`ML URL: ${ML_SERVICE_URL}`);
  
  const payload = {
    message: "What is your primary function?",
    userId: "60f7c2a5e4b0f2a5e4b0f2a5", // Mock MongoDB ID
    documentIds: []
  };

  try {
    console.log('Sending request to ML Service...');
    const response = await axios.post(`${ML_SERVICE_URL}/chat`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ML_SERVICE_API_KEY
      }
    });

    console.log('\n--- ML RESPONSE ---');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.message) {
      console.log('\n✅ SUCCESS: Backend can communicate with ML Chat endpoint.');
    } else {
      console.log('\n❌ FAILURE: ML returned an unexpected response structure.');
    }
  } catch (error: any) {
    console.error('\n❌ ERROR communicating with ML Service:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testBackendToML();
