import 'dotenv/config';
import { connection } from './db';

async function testAdminQuery() {
  try {
    const [rows] = await connection.query('SELECT * FROM admins');
    console.log('Admins:', rows);
    process.exit(0);
  } catch (err) {
    console.error('DB ERROR:', err);
    process.exit(1);
  }
}

testAdminQuery(); 