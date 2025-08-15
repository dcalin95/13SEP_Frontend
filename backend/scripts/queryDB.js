const { db } = require("./database");

db.all("SELECT * FROM transactions ORDER BY date DESC", [], (err, rows) => {
  if (err) {
    console.error("❌ Error reading transactions:", err.message);
    return;
  }

  if (rows.length === 0) {
    console.log("📭 No transactions found in DB.");
    return;
  }

  console.log("📋 Transactions in DB:");
  rows.forEach((row) => {
    console.log(
      `🧾 ID: ${row.id} | Wallet: ${row.wallet_address} | Amount: ${row.amount} | Type: ${row.type} | Network: ${row.network} | BITS: ${row.bits_received} | Signature: ${row.tx_signature}`
    );
  });
});
