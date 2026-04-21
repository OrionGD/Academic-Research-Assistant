import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║        ARAS Database Connectivity Test             ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✗ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const maskedUri = uri.replace(/\/\/.*@/, '//****:****@');
  console.log('📍 Connection URI:', maskedUri);
  console.log('📍 Database Name:', 'aras_db');
  console.log('');

  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✓ MongoDB Connected Successfully!');
    console.log('✓ Connection State: READY\n');

    const adminDb = mongoose.connection.db?.admin();
    const serverStatus = adminDb ? await adminDb.serverInfo() : null;
    
    console.log('📊 Server Information:');
    if (serverStatus) {
      console.log('   - MongoDB Version:', serverStatus.version);
      console.log('   - Host:', serverStatus.host);
    }
    console.log('');

    console.log('📋 Testing Collections...');
    
    const collections = ['users', 'documents', 'chunks', 'chatmessages', 'analysisresults', 'subscriptions'];
    const db = mongoose.connection.db;
    
    if (db) {
      for (const collName of collections) {
        try {
          const count = await db.collection(collName).countDocuments();
          console.log(`   ✓ ${collName}: ${count} documents`);
        } catch {
          console.log(`   ✗ ${collName}: NOT FOUND`);
        }
      }

      console.log('');

      const userCount = await db.collection('users').countDocuments();
      console.log('👥 User Statistics:');
      console.log(`   - Total Users: ${userCount}`);
      
      if (userCount > 0) {
        const sampleUser = await db.collection('users').findOne({}, { projection: { password: 0 } });
        console.log('   - Sample User:', JSON.stringify(sampleUser, null, 4));
      }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✓ All database connectivity tests PASSED!');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n✗ Database Connection Failed!');
    console.error('═══════════════════════════════════════════════════');
    console.error('Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Possible Causes:');
      console.error('   - MongoDB Atlas IP whitelist not configured');
      console.error('   - Network/firewall blocking connection');
      console.error('   - Wrong connection string');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Possible Causes:');
      console.error('   - Incorrect username/password');
      console.error('   - Database user permissions issue');
    }
    
    console.error('\n');
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

testConnection();
