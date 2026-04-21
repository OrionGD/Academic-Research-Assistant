const mongoose = require('mongoose');
require('dotenv').config();

async function exportUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define User schema inline (no need to import full backend)
    const UserSchema = new mongoose.Schema({
      email: String,
      password: String,
      name: String,
      role: String,
      planTier: String,
      subscriptionStatus: String,
      razorpayCustomerId: String,
      razorpaySubscriptionId: String,
      currentPeriodEnd: Date,
    });

    const User = mongoose.model('User', UserSchema);

    // Fetch all users
    const users = await User.find({}, 'email name password role planTier subscriptionStatus razorpayCustomerId razorpaySubscriptionId currentPeriodEnd').lean();

    console.log(`\n📊 Found ${users.length} users:\n`);

    // Generate markdown table
    let md = '# User Database Export\n\n';
    md += '> **Note:** Passwords are stored as bcrypt hashes. This export includes the hashed password values.\n\n';
    md += '| Email | Name | Role | Plan Tier | Subscription Status | Razorpay Customer ID | Subscription ID | Current Period End |\n';
    md += '|-------|------|------|-----------|---------------------|----------------------|----------------|-------------------|\n';

    users.forEach((user, index) => {
      const email = user.email || 'N/A';
      const name = user.name || 'N/A';
      const role = user.role || 'N/A';
      const plan = user.planTier || user.plan || 'N/A';
      const status = user.subscriptionStatus || 'N/A';
      const customerId = user.razorpayCustomerId || 'N/A';
      const subId = user.razorpaySubscriptionId ? user.razorpaySubscriptionId.substring(0, 20) + '...' : 'N/A';
      const periodEnd = user.currentPeriodEnd ? user.currentPeriodEnd.toISOString().split('T')[0] : 'N/A';

      md += `| ${email} | ${name} | ${role} | ${plan} | ${status} | ${customerId} | ${subId} | ${periodEnd} |\n`;
    });

    md += '\n## Password Hashes (for reference)\n\n';
    md += '| Email | Hashed Password (bcrypt) |\n';
    md += '|-------|-------------------------|\n';

    users.forEach(user => {
      if (user.password) {
        const hashPreview = user.password.substring(0, 30) + '...';
        md += `| ${user.email} | \`${hashPreview}\` |\n`;
      }
    });

    // Write to file
    const fs = require('fs');
    const outputPath = 'E:\\PROJECTS\\ARAS\\backend\\docs\\USER_DATABASE.md';
    fs.writeFileSync(outputPath, md);
    console.log(`✅ Export saved to: ${outputPath}`);

    // Also print to console
    console.log('\n--- User Summary ---\n');
    users.forEach(u => {
      console.log(`Email: ${u.email}`);
      console.log(`  Name: ${u.name}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  Plan: ${u.planTier || u.plan}`);
      console.log(`  Subscription: ${u.subscriptionStatus}`);
      console.log(`  Password (hashed): ${u.password ? u.password.substring(0, 40) + '...' : 'none'}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

exportUsers();
