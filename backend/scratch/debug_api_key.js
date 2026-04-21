const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://aras_rag:n2BJW9XGoEkYq3IA@aras.jnqzklv.mongodb.net/?appName=ARAS';
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('aras_db');
    
    const rawKey = 'aras_sk_test_suffix_1234567890abcdef';
    const prefix = rawKey.substring(0, 16);
    
    console.log('Testing Key:', rawKey);
    console.log('Prefix:', prefix);
    
    const keyRecord = await db.collection('api_keys').findOne({ prefix, isActive: true });
    
    if (!keyRecord) {
      console.log('FAIL: Key not found in DB with prefix:', prefix);
      return;
    }
    
    console.log('Key found in DB. Comparing hashes...');
    const valid = await bcrypt.compare(rawKey, keyRecord.keyHash);
    
    if (valid) {
      console.log('SUCCESS: Hash matches!');
    } else {
      console.log('FAIL: Hash mismatch.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
