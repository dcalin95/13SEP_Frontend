const { query } = require("../backend-server/database");

/**
 * 🚀 Script de migrare pentru adăugarea indexurilor de optimizare
 * Rulează acest script o singură dată pentru a aplica indexurile pe DB-ul existent
 */

async function migrateIndexes() {
  console.log("🔄 Starting database index migration...");
  
  try {
    // Index pentru căutări rapide după wallet_address (case-insensitive)
    console.log("📝 Creating index for telegram_user_activity.wallet_address...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_telegram_user_activity_wallet 
      ON telegram_user_activity (LOWER(wallet_address))
    `);
    
    // Index pentru căutări după telegram_id
    console.log("📝 Creating index for telegram_user_activity.telegram_id...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_telegram_user_activity_telegram_id 
      ON telegram_user_activity (telegram_id)
    `);
    
    // Index pentru user_rewards după wallet
    console.log("📝 Creating index for user_rewards.user_wallet...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_rewards_wallet 
      ON user_rewards (user_wallet)
    `);
    
    // Index pentru user_rewards după status
    console.log("📝 Creating index for user_rewards.status...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_rewards_status 
      ON user_rewards (status)
    `);
    
    // Index pentru users după wallet_address
    console.log("📝 Creating index for users.wallet_address...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_wallet_address 
      ON users (wallet_address)
    `);
    
    console.log("✅ Database index migration completed successfully!");
    console.log("🚀 Your database is now optimized for better performance!");
    
  } catch (error) {
    console.error("❌ Error during index migration:", error.message);
    process.exit(1);
  }
}

// Rulează migrarea dacă scriptul este executat direct
if (require.main === module) {
  migrateIndexes()
    .then(() => {
      console.log("🎉 Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateIndexes };
