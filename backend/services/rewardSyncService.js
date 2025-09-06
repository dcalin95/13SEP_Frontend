/**
 * 🎯 HYBRID REWARDS SYNC SERVICE
 * 
 * Sincronizează rewards din PostgreSQL database către Node.sol smart contract
 * pentru a combina performanța database-ului cu transparența blockchain-ului.
 * 
 * FLOW:
 * 1. Telegram bot → PostgreSQL tracking (real-time)
 * 2. Batch sync → PostgreSQL → Node.sol (periodic)
 * 3. Frontend claims → Node.sol direct (transparent)
 */

const { Pool } = require("pg");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// 🔧 Configuration
const NODE_CONTRACT_ADDRESS = process.env.NODE_CONTRACT_ADDRESS || "0x2f4ab05e775bD16959F0A7eBD20B8157D336324A";
const BITS_TOKEN_ADDRESS = process.env.BITS_TOKEN_ADDRESS || process.env.TOKEN_CONTRACT_ADDRESS;
const ADMIN_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY;
const BSC_TESTNET_RPC = process.env.BLOCKCHAIN_URL || "https://data-seed-prebsc-1-s1.binance.org:8545";

// 🗄️ Database Connection
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: 'dpg-d1p5hker433s73d10p50-a',
        port: 5432,
        database: 'presale_db',
        user: 'presale_db_user',
        password: process.env.DATABASE_PASSWORD,
        ssl: { rejectUnauthorized: false }
      }
);

class RewardSyncService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isInitialized = false;
  }

  /**
   * 🔌 Initialize blockchain connection
   */
  async initialize() {
    try {
      console.log("🔌 Initializing RewardSyncService...");
      
      // Setup provider and signer
      this.provider = new ethers.providers.JsonRpcProvider(BSC_TESTNET_RPC);
      
      if (!ADMIN_PRIVATE_KEY) {
        throw new Error("ADMIN_PRIVATE_KEY not found in environment");
      }
      
      this.signer = new ethers.Wallet(ADMIN_PRIVATE_KEY, this.provider);
      
      // Load contract ABI
      const abiPath = path.join(__dirname, "../abi/nodeABI.json");
      if (!fs.existsSync(abiPath)) {
        throw new Error(`Node ABI not found at ${abiPath}`);
      }
      
      const nodeABI = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
      this.contract = new ethers.Contract(NODE_CONTRACT_ADDRESS, nodeABI, this.signer);
      
      // Verify connection
      const network = await this.provider.getNetwork();
      const balance = await this.signer.getBalance();
      
      console.log("✅ RewardSyncService initialized:");
      console.log(`  📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
      console.log(`  👛 Admin Address: ${this.signer.address}`);
      console.log(`  💰 Admin Balance: ${ethers.utils.formatEther(balance)} BNB`);
      console.log(`  📄 Contract: ${NODE_CONTRACT_ADDRESS}`);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize RewardSyncService:", error);
      return false;
    }
  }

  /**
   * 📊 Get pending Telegram rewards from database
   * @returns {Promise<Array>} Array of users with unsynced rewards
   */
  async getPendingTelegramRewards() {
    try {
      const query = `
        SELECT 
          telegram_id,
          username,
          wallet_address,
          seconds_spent,
          messages_total,
          last_milestone,
          last_reward_date,
          total_rewards_claimed
        FROM telegram_user_activity 
        WHERE 
          wallet_address IS NOT NULL 
          AND wallet_address != ''
          AND seconds_spent >= 18000  -- 5+ hours minimum
          AND (
            last_milestone < (seconds_spent / 3600)::int 
            OR last_reward_date IS NULL
            OR last_reward_date < NOW() - INTERVAL '24 hours'
          )
        ORDER BY seconds_spent DESC
        LIMIT 100  -- Process in batches
      `;
      
      const result = await pool.query(query);
      
      console.log(`📊 Found ${result.rows.length} users with pending Telegram rewards`);
      return result.rows;
    } catch (error) {
      console.error("❌ Error getting pending Telegram rewards:", error);
      return [];
    }
  }

  /**
   * 🎁 Calculate reward amount based on activity hours
   * @param {number} secondsSpent - Total seconds spent in Telegram
   * @returns {Object} Reward calculation
   */
  calculateTelegramReward(secondsSpent) {
    const hours = secondsSpent / 3600;
    
    let rewardBits = 0;
    let milestone = 0;
    
    if (hours >= 100) {
      rewardBits = 500;
      milestone = 100;
    } else if (hours >= 50) {
      rewardBits = 250;
      milestone = 50;
    } else if (hours >= 20) {
      rewardBits = 100;
      milestone = 20;
    } else if (hours >= 5) {
      rewardBits = 50;
      milestone = 5;
    }
    
    return {
      hours: Math.floor(hours),
      milestone,
      rewardBits,
      rewardWei: ethers.utils.parseEther(rewardBits.toString())
    };
  }

  /**
   * 🔄 Sync Telegram rewards to Node.sol contract
   * @param {number} batchSize - Number of users to process per batch
   * @returns {Promise<Object>} Sync result
   */
  async syncTelegramRewards(batchSize = 10) {
    if (!this.isInitialized) {
      const success = await this.initialize();
      if (!success) return { success: false, error: "Failed to initialize" };
    }

    try {
      console.log("🔄 Starting Telegram rewards sync...");
      
      const pendingUsers = await this.getPendingTelegramRewards();
      if (pendingUsers.length === 0) {
        console.log("✅ No pending Telegram rewards to sync");
        return { success: true, processed: 0, message: "No pending rewards" };
      }

      let processed = 0;
      let errors = 0;

      // Process users in batches
      for (let i = 0; i < pendingUsers.length; i += batchSize) {
        const batch = pendingUsers.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1} (${batch.length} users)`);

        const codes = [];
        const firstRates = [];
        const secondFunds = [];

        for (const user of batch) {
          const reward = this.calculateTelegramReward(user.seconds_spent);
          
          if (reward.rewardBits > 0) {
            // Generate unique code for this user
            const code = `TELEGRAM_${user.telegram_id}_${Date.now()}`;
            
            codes.push(code);
            firstRates.push(ethers.utils.parseUnits("10", 2)); // 10% rate (2 decimals)
            secondFunds.push(reward.rewardWei); // Reward amount in wei
            
            console.log(`  📝 ${user.username}: ${reward.hours}h → ${reward.rewardBits} BITS (Code: ${code})`);
          }
        }

        if (codes.length > 0) {
          try {
            // Execute setupRefData transaction
            console.log(`🚀 Executing setupRefData for ${codes.length} rewards...`);
            
            const tx = await this.contract.setupRefData(codes, firstRates, secondFunds);
            console.log(`  📤 Transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`  ✅ Transaction confirmed in block ${receipt.blockNumber}`);
            
            // Update database with sync status
            for (let j = 0; j < batch.length; j++) {
              const user = batch[j];
              const reward = this.calculateTelegramReward(user.seconds_spent);
              
              if (reward.rewardBits > 0) {
                await pool.query(`
                  UPDATE telegram_user_activity 
                  SET 
                    last_milestone = $1,
                    last_reward_date = NOW(),
                    total_rewards_claimed = COALESCE(total_rewards_claimed, 0) + $2,
                    updated_at = NOW()
                  WHERE telegram_id = $3
                `, [reward.milestone, reward.rewardBits, user.telegram_id]);
                
                processed++;
              }
            }

            console.log(`  📊 Updated ${codes.length} users in database`);
            
          } catch (txError) {
            console.error(`❌ Transaction failed for batch:`, txError);
            errors += batch.length;
          }
        }

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < pendingUsers.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const result = {
        success: true,
        processed,
        errors,
        total: pendingUsers.length,
        message: `Processed ${processed}/${pendingUsers.length} rewards (${errors} errors)`
      };

      console.log("✅ Telegram rewards sync completed:", result);
      return result;

    } catch (error) {
      console.error("❌ Error syncing Telegram rewards:", error);
      return {
        success: false,
        error: error.message,
        message: "Sync failed"
      };
    }
  }

  /**
   * 📋 Generate sync report
   * @returns {Promise<Object>} Detailed sync status report
   */
  async generateSyncReport() {
    try {
      // Database stats
      const dbStats = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN wallet_address IS NOT NULL THEN 1 END) as users_with_wallet,
          COUNT(CASE WHEN seconds_spent >= 18000 THEN 1 END) as eligible_users,
          AVG(seconds_spent / 3600) as avg_hours,
          SUM(total_rewards_claimed) as total_claimed
        FROM telegram_user_activity
      `);

      // Pending rewards
      const pending = await this.getPendingTelegramRewards();

      // Contract stats (if initialized)
      let contractStats = null;
      if (this.isInitialized) {
        try {
          const adminBalance = await this.signer.getBalance();
          contractStats = {
            adminBalance: ethers.utils.formatEther(adminBalance),
            contractAddress: NODE_CONTRACT_ADDRESS,
            network: (await this.provider.getNetwork()).name
          };
        } catch (e) {
          contractStats = { error: e.message };
        }
      }

      return {
        timestamp: new Date().toISOString(),
        database: dbStats.rows[0],
        pending: {
          count: pending.length,
          users: pending.slice(0, 5).map(u => ({
            username: u.username,
            hours: Math.floor(u.seconds_spent / 3600),
            wallet: u.wallet_address?.slice(0, 10) + "..."
          }))
        },
        contract: contractStats
      };
    } catch (error) {
      console.error("❌ Error generating sync report:", error);
      return { error: error.message };
    }
  }

  /**
   * 🧹 Cleanup and close connections
   */
  async cleanup() {
    try {
      await pool.end();
      console.log("✅ Database connections closed");
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
    }
  }
}

// 🎯 Export singleton instance
const rewardSyncService = new RewardSyncService();

module.exports = rewardSyncService;

/**
 * 🏃‍♂️ CLI Runner (for manual execution and cron jobs)
 */
if (require.main === module) {
  console.log("🎯 HYBRID REWARDS SYNC - Manual Execution");
  
  const command = process.argv[2] || "sync";
  
  switch (command) {
    case "sync":
      console.log("🔄 Starting sync process...");
      rewardSyncService.syncTelegramRewards()
        .then(result => {
          console.log("📊 Sync Result:", result);
          process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
          console.error("❌ Sync failed:", error);
          process.exit(1);
        });
      break;
      
    case "report":
      console.log("📋 Generating sync report...");
      rewardSyncService.generateSyncReport()
        .then(report => {
          console.log("📊 Sync Report:", JSON.stringify(report, null, 2));
          process.exit(0);
        })
        .catch(error => {
          console.error("❌ Report failed:", error);
          process.exit(1);
        });
      break;
      
    case "test":
      console.log("🧪 Testing service initialization...");
      rewardSyncService.initialize()
        .then(success => {
          console.log(success ? "✅ Service test passed" : "❌ Service test failed");
          process.exit(success ? 0 : 1);
        })
        .catch(error => {
          console.error("❌ Test failed:", error);
          process.exit(1);
        });
      break;
      
    default:
      console.log(`
🎯 HYBRID REWARDS SYNC SERVICE

Usage:
  node rewardSyncService.js [command]

Commands:
  sync    - Sync pending Telegram rewards to Node.sol (default)
  report  - Generate detailed sync status report  
  test    - Test service initialization and connectivity

Environment Variables:
  NODE_CONTRACT_ADDRESS  - Node.sol contract address
  ADMIN_PRIVATE_KEY     - Admin wallet private key
  DATABASE_URL          - PostgreSQL connection string
  BLOCKCHAIN_URL        - BSC RPC endpoint

Examples:
  node rewardSyncService.js sync
  node rewardSyncService.js report
  node rewardSyncService.js test
      `);
      process.exit(0);
  }
}







