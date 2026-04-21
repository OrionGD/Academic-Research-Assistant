import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not defined');

    await mongoose.connect(uri);
    console.log('✓ Connected');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in DB:', collections.map(c => c.name).join(', '));

    for (const coll of collections) {
      const name = coll.name;
      if (name.includes('chunk')) {
        console.log(`\nChecking search indexes for: ${name}...`);
        const collection = mongoose.connection.db.collection(name);
        try {
          const indexes = await collection.listSearchIndexes().toArray();
          if (indexes.length === 0) {
            console.log(`  - No search indexes found on ${name}.`);
          } else {
            console.log(`  - Found ${indexes.length} search index(es) on ${name}:`);
            console.log(JSON.stringify(indexes, null, 2));
          }
        } catch (e: any) {
          console.error(`  - Error listing search indexes on ${name}: ${e.message}`);
        }
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

run();
