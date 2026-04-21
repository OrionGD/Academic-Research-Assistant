
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

async function testFullChatFlow() {
  console.log('--- Starting Full E2E Chat Flow Test ---');
  
  const timestamp = Date.now();
  const testEmail = `chat_test_${timestamp}@example.com`;
  const password = 'Password@123';

  try {
    // 1. Register
    console.log('1. Registering new user...');
    await axios.post(`${BACKEND_URL}/auth/register`, {
      fullName: 'Chat Tester',
      email: testEmail,
      password: password
    });

    // 2. Login
    console.log('2. Logging in...');
    const loginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: testEmail,
      password: password
    });
    const token = loginRes.data.token;
    console.log('Token obtained.');

    // 3. Chat
    console.log('3. Sending chat message to /api/chat ...');
    const chatPaylod = {
      sessionId: `session_${timestamp}`,
      query: "Explain what ARAS does in one sentence."
    };

    const chatRes = await axios.post(`${BACKEND_URL}/chat`, chatPaylod, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n--- CHAT RESPONSE ---');
    console.log(JSON.stringify(chatRes.data.message.content, null, 2));

    if (chatRes.data.message.content) {
      console.log('\n✅ SUCCESS: Full E2E Chat flow verified!');
    } else {
      console.log('\n❌ FAILURE: Empty response from AI.');
    }

  } catch (error: any) {
    console.error('\n❌ E2E TEST FAILED:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testFullChatFlow();
