const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://aras_rag:n2BJW9XGoEkYq3IA@aras.jnqzklv.mongodb.net/?appName=ARAS';
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('aras_db');
    const userId = '69e0817cd7e470c699ce0bdd';
    const KEY_PREFIX = 'aras_sk_';
    const rawSuffix = 'test_suffix_1234567890abcdef';
    const rawKey = KEY_PREFIX + rawSuffix;
    const prefix = rawKey.substring(0, 16);
    
    console.log('Hashing key...');
    const keyHash = await bcrypt.hash(rawKey, 10);
    
    console.log('Updating database...');
    await db.collection('api_keys').updateOne(
      { userId: new ObjectId(userId), prefix: prefix },
      { 
        $set: { 
          userId: new ObjectId(userId), 
          name: 'Automated Test Key',
          keyHash: keyHash,
          prefix: prefix,
          isActive: true,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
    
    console.log('API Key registered: ' + rawKey);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
