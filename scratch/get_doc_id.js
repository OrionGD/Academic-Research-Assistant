const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function getDoc() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ARAS');
    const doc = await mongoose.connection.db.collection('documents').findOne({});
    if (doc) {
        console.log(doc._id.toString());
    } else {
        console.log('No documents found');
    }
    await mongoose.disconnect();
}
getDoc();
