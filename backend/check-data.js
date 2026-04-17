const { pool } = require('./src/config/database');

async function checkData() {
  try {
    console.log('\n=== HOSTELS ===');
    const [hostels] = await pool.query('SELECT id, name, block_code FROM hostels');
    console.log('Hostels:', hostels.length > 0 ? hostels : 'No hostels found');

    console.log('\n=== WARDENS ===');
    const [wardens] = await pool.query("SELECT id, name, email FROM users WHERE role = 'warden'");
    console.log('Wardens:', wardens.length > 0 ? wardens : 'No wardens found');

    console.log('\n=== FLOOR WARDEN ASSIGNMENTS ===');
    const [assignments] = await pool.query(`
      SELECT fwa.block, fwa.floor, fwa.wing, fwa.warden_id, u.name, u.email
      FROM floor_warden_assignments fwa
      INNER JOIN users u ON u.id = fwa.warden_id
    `);
    console.log('Assignments:', assignments.length > 0 ? assignments : 'No assignments found');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkData();
