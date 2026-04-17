const { pool } = require('./src/config/database');

async function updateHostels() {
  try {
    console.log('Updating hostels with block codes...');
    
    // Update Coral to block A
    await pool.query('UPDATE hostels SET block_code = ? WHERE name = ?', ['A', 'Coral ']);
    
    // Update Bavani to block B
    await pool.query('UPDATE hostels SET block_code = ? WHERE name = ?', ['B', 'Bavani ']);
    
    console.log('✅ Hostels updated successfully');
    
    // Verify
    const [hostels] = await pool.query('SELECT id, name, block_code FROM hostels');
    console.log('\nUpdated hostels:');
    console.log(hostels);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateHostels();
