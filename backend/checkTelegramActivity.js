const { db } = require("./database");

console.log("🔍 Checking Telegram Activity in Database...\n");

// Verifică utilizatorii activi
db.all("SELECT * FROM telegram_user_activity ORDER BY seconds_spent DESC", [], (err, rows) => {
  if (err) {
    console.error("❌ Error reading telegram_user_activity:", err.message);
    return;
  }

  if (rows.length === 0) {
    console.log("📭 No users found in telegram_user_activity.");
  } else {
    console.log("👥 Users in telegram_user_activity:");
    rows.forEach((row) => {
      const hours = (row.seconds_spent / 3600).toFixed(2);
      console.log(
        `👤 ID: ${row.telegram_id} | Username: ${row.username} | Time: ${hours}h | Last seen: ${new Date(row.last_seen * 1000).toLocaleString()}`
      );
    });
  }
});

// Verifică wallet-urile înregistrate
db.all("SELECT * FROM telegram_wallets", [], (err, rows) => {
  if (err) {
    console.error("❌ Error reading telegram_wallets:", err.message);
    return;
  }

  if (rows.length === 0) {
    console.log("\n📭 No wallets found in telegram_wallets.");
  } else {
    console.log("\n👛 Wallets in telegram_wallets:");
    rows.forEach((row) => {
      console.log(
        `🔗 Telegram ID: ${row.telegram_id} | Wallet: ${row.wallet}`
      );
    });
  }
});

// Verifică utilizatorii eligibili (5 ore+)
db.all("SELECT * FROM telegram_user_activity WHERE seconds_spent >= 18000", [], (err, rows) => {
  if (err) {
    console.error("❌ Error reading eligible users:", err.message);
    return;
  }

  if (rows.length === 0) {
    console.log("\n📭 No eligible users found (5+ hours).");
  } else {
    console.log("\n✅ Eligible users (5+ hours):");
    rows.forEach((row) => {
      const hours = (row.seconds_spent / 3600).toFixed(2);
      console.log(
        `🎁 ${row.username} (${row.telegram_id}): ${hours}h - ELIGIBLE FOR REWARD!`
      );
    });
  }
}); 