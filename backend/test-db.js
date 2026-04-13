const { testConnection } = require('./src/config/database');

testConnection().then(() => {
  console.log("DB connection successful!");
  process.exit(0);
}).catch(err => {
  console.error("DB connection error:", err);
  process.exit(1);
});
