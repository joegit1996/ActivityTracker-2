import { storage } from './server/storage.js';
import { hashPassword } from './server/auth.js';

async function createFirstAdmin() {
  try {
    // Check if any admin users exist
    const adminCount = await storage.countAdminUsers();
    if (adminCount > 0) {
      console.log('❌ Admin users already exist.');
      process.exit(1);
    }

    // Create admin with default credentials
    const username = 'admin';
    const password = 'admin123456'; // You can change this after first login
    
    console.log('🔄 Creating first admin user...');
    const hashedPassword = await hashPassword(password);
    
    const admin = await storage.createAdminUser({
      username,
      passwordHash: hashedPassword,
      isActive: true,
    });

    console.log('✅ First admin user created successfully!');
    console.log(`👤 Username: ${admin.username}`);
    console.log(`🔑 Password: ${password}`);
    console.log('\n⚠️  Please change the password after first login!');
    console.log('🔗 Login at: /admin/login');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
  process.exit(0);
}

createFirstAdmin();
