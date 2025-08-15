const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const util = require("util");

const dbPath = path.resolve(__dirname, "database.db");
const db = new sqlite3.Database(dbPath);

const runAsync = util.promisify(db.run.bind(db));
const getAsync = util.promisify(db.get.bind(db));
const allAsync = util.promisify(db.all.bind(db));
const notifyTransaction = require("./services/notifyTelegram");

// ===============================
// 💾 CREARE TABELĂ TRANZACȚII
// ===============================
db.run(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    network TEXT DEFAULT 'EVM',
    bits_received REAL DEFAULT 0,
    bonus_percentage REAL DEFAULT 0,
    bonus_bits REAL DEFAULT 0,
    signature TEXT UNIQUE,
    tx_hash_on_chain TEXT
  )
`);

// ===============================
// 🧠 TELEGRAM ACTIVITY
// ===============================
db.run(`
  CREATE TABLE IF NOT EXISTS telegram_user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT UNIQUE,
    username TEXT,
    seconds_spent INTEGER DEFAULT 0,
    last_seen INTEGER,
    wallet_address TEXT,
    last_reward_date DATETIME,
    total_rewards_claimed REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ===============================
// 💼 TELEGRAM -> WALLET
// ===============================
db.run(`
  CREATE TABLE IF NOT EXISTS telegram_wallets (
    telegram_id TEXT PRIMARY KEY,
    wallet TEXT NOT NULL
  )
`);

// ===============================
// 🎁 REFERRALS
// ===============================
db.run(`
  CREATE TABLE IF NOT EXISTS invite_referrals (
    code TEXT PRIMARY KEY,
    referrer_telegram_id TEXT NOT NULL,
    referee_wallet TEXT,
    reward_amount INTEGER DEFAULT 10,
    reward_claimed INTEGER DEFAULT 0
  )
`);

// ===============================
// 🪙 PREȚ ȘI RUNDE PRESALE
// ===============================
db.run(`
  CREATE TABLE IF NOT EXISTS presale_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL DEFAULT 1,
    tokensAvailable INTEGER NOT NULL DEFAULT 1000000,
    raised_usd REAL NOT NULL DEFAULT 0,
    sold_bits REAL NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ===============================
// 📊 TOTAL & ANALYTICS PRESALE
// ===============================
db.run(`
  CREATE TABLE IF NOT EXISTS presale_total (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    raised_usd REAL DEFAULT 0,
    sold_bits REAL DEFAULT 0
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS presale_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round INTEGER NOT NULL,
    simulated_usd REAL DEFAULT 0,
    simulated_bits REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ===============================
// FUNCȚII: Tranzacții
// ===============================
async function saveTransactionAsync(wallet, amount, type, status, error, network, bits, signature, bonusPercentage = 0, bonusBits = 0) {
  const query = `
    INSERT INTO transactions
    (wallet_address, amount, type, status, error_message, network, bits_received, signature, bonus_percentage, bonus_bits)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await runAsync(query, [wallet, amount, type, status, error, network, bits, signature, bonusPercentage, bonusBits]);

  if (status === "success" && type === "buy_bits") {
    await notifyTransaction({ wallet, amount, type, network, date: new Date().toISOString() });
  }
}

async function updateTransactionStatusAndHash(signature, status, txHash) {
  await runAsync(`UPDATE transactions SET status = ?, tx_hash_on_chain = ? WHERE signature = ?`, [status, txHash, signature]);
}

async function checkIfTransactionExists(signature) {
  const result = await getAsync(`SELECT id FROM transactions WHERE signature = ?`, [signature]);
  return !!result;
}

async function getPendingTransactions() {
  return await allAsync(`SELECT * FROM transactions WHERE status = 'pending'`);
}

async function getAllTransactions() {
  return await allAsync(`SELECT * FROM transactions`);
}

// ===============================
// FUNCȚII: Telegram + Referral
// ===============================
async function updateUserActivity(telegramId, username) {
  const now = Math.floor(Date.now() / 1000);
  const existing = await getAsync(`SELECT * FROM telegram_user_activity WHERE telegram_id = ?`, [telegramId]);

  if (existing) {
    const updatedSeconds = existing.seconds_spent + (now - (existing.last_seen || now));
    await runAsync(`UPDATE telegram_user_activity SET seconds_spent = ?, last_seen = ?, username = ? WHERE telegram_id = ?`, [updatedSeconds, now, username, telegramId]);
  } else {
    await runAsync(`INSERT INTO telegram_user_activity (telegram_id, username, last_seen) VALUES (?, ?, ?)`, [telegramId, username, now]);
  }
}

async function getEligibleUsers(minSeconds = 18000) {
  return await allAsync(`SELECT * FROM telegram_user_activity WHERE seconds_spent >= ?`, [minSeconds]);
}

async function resetUserTimer(telegramId) {
  await runAsync(`UPDATE telegram_user_activity SET seconds_spent = 0 WHERE telegram_id = ?`, [telegramId]);
}

async function saveUserWallet(telegramId, wallet) {
  await runAsync(`INSERT OR REPLACE INTO telegram_wallets (telegram_id, wallet) VALUES (?, ?)`, [telegramId, wallet]);
}

async function getUserWallet(telegramId) {
  const result = await getAsync(`SELECT wallet FROM telegram_wallets WHERE telegram_id = ?`, [telegramId]);
  return result?.wallet || null;
}

async function saveReferralCode(code, referrerTelegramId) {
  await runAsync(`INSERT OR IGNORE INTO invite_referrals (code, referrer_telegram_id) VALUES (?, ?)`, [code, referrerTelegramId]);
}

async function setReferralWallet(code, refereeWallet) {
  await runAsync(`UPDATE invite_referrals SET referee_wallet = ? WHERE code = ? AND referee_wallet IS NULL`, [refereeWallet, code]);
}

async function getUnclaimedReferrals() {
  return await allAsync(`SELECT * FROM invite_referrals WHERE reward_claimed = 0 AND referee_wallet IS NOT NULL`);
}

async function markReferralClaimed(code) {
  await runAsync(`UPDATE invite_referrals SET reward_claimed = 1 WHERE code = ?`, [code]);
}

async function getReferralsByTelegramId(telegramId) {
  return await allAsync(`SELECT referee_wallet FROM invite_referrals WHERE referrer_telegram_id = ? AND referee_wallet IS NOT NULL`, [telegramId]);
}

async function getReferralRewardSummary(telegramId) {
  const result = await getAsync(`SELECT SUM(reward_amount) as total FROM invite_referrals WHERE referrer_telegram_id = ? AND reward_claimed = 1`, [telegramId]);
  return result?.total || 0;
}

// ===============================
// FUNCȚII: PRESALE
// ===============================
async function getLatestPresaleState() {
  return await getAsync(`
    SELECT * FROM presale_state 
    ORDER BY id DESC LIMIT 1
  `);
}

async function simulatePresaleIncrement({ addedUsd = 0, addedBits = 0 }) {
  console.log(`Simulating presale increment with added USD: ${addedUsd}, added BITS: ${addedBits}`);
  const last = await getLatestPresaleState();

  if (!last) throw new Error("No active presale round.");

  const newUsd = (last.raised_usd || 0) + addedUsd;
  const newBits = (last.sold_bits || 0) + addedBits;

const newTokensAvailable = Math.max((last.tokensAvailable || 0) - addedBits, 0);

await runAsync(`
  UPDATE presale_state
  SET raised_usd = ?, sold_bits = ?, tokensAvailable = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`, [newUsd, newBits, newTokensAvailable, last.id]);


  return {
    round: last.round,
    price: last.price,
    raised_usd: newUsd,
    sold_bits: newBits
  };
}


async function manuallySetPresale({ round, price, tokensAvailable }) {
  await runAsync(`
    INSERT INTO presale_state (round, price, tokensAvailable, raised_usd, sold_bits)
    VALUES (?, ?, ?, 0, 0)
  `, [round, price, tokensAvailable]);
}

async function endCurrentPresaleRound() {
  const last = await getLatestPresaleState();

  if (!last) throw new Error("No active presale round found.");

  await runAsync(`
    INSERT INTO presale_state (round, price, tokensAvailable, raised_usd, sold_bits)
    VALUES (?, ?, 0, ?, ?)
  `, [last.round, last.price, last.raised_usd, last.sold_bits]);
}

async function getPresaleTotal() {
  const row = await getAsync(`SELECT * FROM presale_total WHERE id = 1`);
  if (!row) {
    // Asigurăm fallback sigur
    return { raised_usd: 0, sold_bits: 0 };
  }
  return row;
}


async function updatePresaleTotal(addedUsd, addedBits) {
  console.log('[LOG] updatePresaleTotal called with:', { addedUsd, addedBits });
  const existing = await getPresaleTotal();
  console.log('[LOG] Existing presale_total:', existing);

  if (existing.raised_usd !== undefined) {
    await runAsync(`
      UPDATE presale_total 
      SET raised_usd = raised_usd + ?, sold_bits = sold_bits + ? 
      WHERE id = 1
    `, [addedUsd, addedBits]);
    console.log('[LOG] UPDATE presale_total (existing row)');
  } else {
    await runAsync(`
      INSERT INTO presale_total (id, raised_usd, sold_bits)
      VALUES (1, ?, ?)
    `, [addedUsd, addedBits]);
    console.log('[LOG] INSERT INTO presale_total (new row)');
  }
  const after = await getPresaleTotal();
  console.log('[LOG] presale_total after update:', after);
}

async function recordRoundAnalytics(round, usd, bits) {
  await runAsync(`
    INSERT INTO presale_analytics (round, simulated_usd, simulated_bits)
    VALUES (?, ?, ?)
  `, [round, usd, bits]);
}

async function getAllRoundAnalytics() {
  return await allAsync(`SELECT * FROM presale_analytics ORDER BY round ASC`);
}
async function resetPresaleData() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM presale_total`);
      db.run(`DELETE FROM presale_analytics`);
      db.run(`DELETE FROM presale_state`, (err) => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  });
}
async function ensurePresaleTotalInitialized() {
  const row = await getAsync(`SELECT * FROM presale_total WHERE id = 1`);
  if (!row) {
    await runAsync(`INSERT INTO presale_total (id, raised_usd, sold_bits) VALUES (1, 0, 0)`);
    console.log("[INIT] presale_total row creat automat.");
  }
}
ensurePresaleTotalInitialized().catch(console.error);


// ===============================
// ✅ EXPORT FINAL UNIC
// ===============================
module.exports = {
  db,

  // tranzacții
  saveTransactionAsync,
  updateTransactionStatusAndHash,
  checkIfTransactionExists,
  getPendingTransactions,
  getAllTransactions,

  // telegram
  updateUserActivity,
  getEligibleUsers,
  resetUserTimer,
  getReferralsByTelegramId,

  // wallet
  saveUserWallet,
  getUserWallet,

  // referrals
  saveReferralCode,
  setReferralWallet,
  getUnclaimedReferrals,
  markReferralClaimed,
  getReferralRewardSummary,

  // presale
  getLatestPresaleState,
  simulatePresaleIncrement,
  manuallySetPresale,
  endCurrentPresaleRound,

  // analytics
  getPresaleTotal,
  updatePresaleTotal,
  recordRoundAnalytics,
  getAllRoundAnalytics,
  resetPresaleData
};
