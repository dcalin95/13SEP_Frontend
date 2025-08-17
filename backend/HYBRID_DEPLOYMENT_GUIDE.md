# 🎯 HYBRID REWARDS SYSTEM - DEPLOYMENT GUIDE

## 📋 OVERVIEW

Sistemul HYBRID combină performanța PostgreSQL database cu transparența blockchain-ului pentru reward management optimal.

**FLOW:**
```
Telegram Activity → PostgreSQL → Batch Sync → Node.sol → Frontend Claims
     (Real-time)    (Fast DB)    (Periodic)   (Blockchain)  (Transparent)
```

---

## 🚀 QUICK START

### 1. **Environment Variables**

Adaugă în `.env`:

```bash
# 🔗 Node.sol Contract
NODE_CONTRACT_ADDRESS=0x2f4ab05e775bD16959F0A7eBD20B8157D336324A
BITS_TOKEN_ADDRESS=0xYourBitsTokenAddress
ADMIN_PRIVATE_KEY=0xYourAdminPrivateKey

# 🌐 Blockchain
BLOCKCHAIN_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# 📧 Notifications (Optional)
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/your-webhook

# ⏰ Sync Configuration
REWARD_SYNC_SCHEDULE="0 2 * * *"  # Daily at 2 AM UTC
REWARD_SYNC_PORT=3002
ENABLE_REWARD_SYNC_API=true
RUN_INITIAL_SYNC=false
```

### 2. **Start Reward Sync Service**

```bash
# Test service connectivity
node backend/scripts/runRewardSync.js health

# Run manual sync (test)
node backend/scripts/runRewardSync.js sync

# Start scheduled sync service
node backend/scripts/runRewardSync.js start
```

### 3. **Frontend Testing**

```bash
cd frontend
npm start

# Test pages:
# - http://localhost:3000/presale (InvestmentRewardsWithClaim)
# - http://localhost:3000/invite (ClaimInviteComponent)
```

---

## 🔧 COMPONENT STATUS

### ✅ **COMPLETED**

1. **`nodeRewardsService.js`** - Frontend service pentru Node.sol
2. **`InvestmentRewardsWithClaim.js`** - HYBRID reward display
3. **`ClaimInviteComponent.js`** - HYBRID invite claims
4. **`rewardSyncService.js`** - Backend sync service
5. **`runRewardSync.js`** - Automated sync runner

### 📋 **TESTING CHECKLIST**

- [ ] **Wallet Connection**
  ```javascript
  // Test in browser console:
  window.ethereum.request({method: 'eth_requestAccounts'})
  ```

- [ ] **Node.sol Contract**
  ```bash
  node -e "
  const service = require('./backend/services/rewardSyncService');
  service.initialize().then(success => console.log('Contract:', success));
  "
  ```

- [ ] **Database Connection**
  ```bash
  node -e "
  const { Pool } = require('pg');
  const pool = new Pool({connectionString: process.env.DATABASE_URL});
  pool.query('SELECT COUNT(*) FROM telegram_user_activity').then(r => console.log('DB Users:', r.rows[0]));
  "
  ```

- [ ] **Frontend Service**
  - Open DevTools → Console în browser
  - Verify no import errors
  - Test wallet connection
  - Check Node.sol data loading

- [ ] **Sync Process**
  ```bash
  # Generate sync report
  node backend/scripts/runRewardSync.js health
  
  # Test manual sync
  node backend/scripts/runRewardSync.js sync
  ```

---

## 🏗️ ARCHITECTURE DETAILS

### **📊 Database Schema (PostgreSQL)**

```sql
-- Existing table enhanced for HYBRID
ALTER TABLE telegram_user_activity ADD COLUMN IF NOT EXISTS last_reward_sync TIMESTAMP;
ALTER TABLE telegram_user_activity ADD COLUMN IF NOT EXISTS node_reward_code TEXT;
ALTER TABLE telegram_user_activity ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';
```

### **🔗 Smart Contract Integration**

**Key Functions Used:**
- `getUserRewardBalance(address)` - Get user's total reward
- `getCodeRewardInfo(string)` - Get invite code rewards
- `claimRefCode(...)` - Claim rewards with signature
- `setupRefData(...)` - Admin batch setup rewards

### **🔄 Sync Process**

1. **Query Database**
   ```sql
   SELECT * FROM telegram_user_activity 
   WHERE wallet_address IS NOT NULL 
   AND seconds_spent >= 18000  -- 5+ hours
   AND (last_milestone < current_milestone OR last_reward_date < NOW() - INTERVAL '24 hours')
   ```

2. **Calculate Rewards**
   - 5h → 50 BITS
   - 20h → 100 BITS  
   - 50h → 250 BITS
   - 100h → 500 BITS

3. **Batch Setup on Node.sol**
   ```javascript
   contract.setupRefData(
     codes,        // ["TELEGRAM_123_1234567890", ...]
     firstRates,   // [1000, 1000, ...] // 10% in basis points
     secondFunds   // [50000000000000000000, ...] // 50 BITS in wei
   )
   ```

4. **Update Database Status**
   ```sql
   UPDATE telegram_user_activity 
   SET last_milestone = $1, last_reward_date = NOW(), sync_status = 'synced'
   WHERE telegram_id = $2
   ```

---

## 🌐 API ENDPOINTS

When `ENABLE_REWARD_SYNC_API=true`:

```bash
# Manual sync trigger
curl -X POST http://localhost:3002/sync

# Health check
curl http://localhost:3002/health

# Service status
curl http://localhost:3002/status

# Sync history
curl http://localhost:3002/history?limit=5

# Detailed report
curl http://localhost:3002/report
```

---

## 📊 MONITORING

### **Key Metrics**

1. **Sync Success Rate**
   - Target: >95% success rate
   - Monitor via `/history` endpoint

2. **Pending Rewards**
   - Users with unsynced rewards
   - Monitor via `/report` endpoint

3. **Contract Balance**
   - Admin wallet balance for gas
   - Monitor via health checks

4. **Database Performance**
   - Query execution time
   - Connection pool status

### **Alerts Setup**

```bash
# Daily sync status email
echo "curl -s http://localhost:3002/status | mail -s 'Reward Sync Status' admin@example.com" | crontab

# Slack webhook notification
export NOTIFICATION_WEBHOOK_URL="https://hooks.slack.com/your-webhook"
```

---

## 🔧 TROUBLESHOOTING

### **Common Issues**

1. **"Contract not found"**
   ```bash
   # Verify contract address
   echo $NODE_CONTRACT_ADDRESS
   
   # Test network connectivity
   curl -X POST $BLOCKCHAIN_URL -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
   ```

2. **"Insufficient gas"**
   ```bash
   # Check admin balance
   node -e "
   const ethers = require('ethers');
   const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_URL);
   const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
   wallet.getBalance().then(b => console.log('Balance:', ethers.utils.formatEther(b), 'BNB'));
   "
   ```

3. **"Database connection failed"**
   ```bash
   # Test database
   node -e "
   const { Pool } = require('pg');
   const pool = new Pool({connectionString: process.env.DATABASE_URL});
   pool.query('SELECT NOW()').then(r => console.log('DB Time:', r.rows[0]));
   "
   ```

4. **"Frontend wallet not connecting"**
   - Check MetaMask installed
   - Verify BSC Testnet added (Chain ID: 97)
   - Clear browser cache/storage

### **Debug Mode**

```bash
# Enable verbose logging
export DEBUG=reward-sync:*

# Run with detailed output
node backend/scripts/runRewardSync.js sync 2>&1 | tee sync.log
```

---

## 🚀 PRODUCTION DEPLOYMENT

### **Render.com Setup**

1. **Add Environment Variables** in Render dashboard
2. **Deploy Sync Service** as background worker:
   ```bash
   # Start command:
   node backend/scripts/runRewardSync.js start
   ```

3. **Monitor Logs** in Render dashboard
4. **Set up Monitoring** alerts

### **Health Checks**

```bash
# Add to your monitoring system
curl -f http://your-render-app.com:3002/health || exit 1
```

### **Backup Strategy**

```bash
# Daily backup of sync status
curl -s http://localhost:3002/history?limit=100 > backup/sync-history-$(date +%Y%m%d).json
```

---

## 📈 PERFORMANCE METRICS

**Expected Performance:**
- **Sync Time:** ~30 seconds for 100 users
- **Gas Cost:** ~0.01 BNB per batch (10 users)
- **Database Load:** <5% CPU impact
- **Memory Usage:** <100MB for sync service

**Scalability:**
- **Max Users per Batch:** 50 (adjustable)
- **Daily Throughput:** 10,000+ users
- **Sync Frequency:** Configurable (min: hourly)

---

## ✅ VERIFICATION COMMANDS

```bash
# 1. Test all services
node backend/scripts/runRewardSync.js health

# 2. Verify frontend service
cd frontend && npm start
# Open: http://localhost:3000/presale

# 3. Test API endpoints
curl http://localhost:3002/status

# 4. Check database connectivity
node -e "require('./backend/services/rewardSyncService').generateSyncReport().then(r => console.log(JSON.stringify(r, null, 2)))"

# 5. Verify contract functions
node -e "
const service = require('./backend/services/nodeRewardsService');
service.initialize().then(() => service.getContractInfo()).then(console.log);
"
```

**🎯 Systemul HYBRID este gata pentru deployment!**

**Key Benefits:**
- ✅ Real-time Telegram tracking (PostgreSQL)
- ✅ Transparent blockchain claims (Node.sol) 
- ✅ Automated sync process
- ✅ Fallback mechanisms
- ✅ Comprehensive monitoring
- ✅ Scalable architecture

---

**Next Steps:**
1. Run verification commands
2. Test on staging environment  
3. Deploy to production
4. Monitor sync performance
5. Set up alerts and backups







