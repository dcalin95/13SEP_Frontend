const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("database.db");

db.run(
  `INSERT INTO presale_total (id, raised_usd, sold_bits) VALUES (1, 0, 0)`,
  function (err) {
    if (err) {
      console.error("❌ Eroare la inserare:", err.message);
    } else {
      console.log("✅ Inserare reușită în presale_total.");
    }
    db.close();
  }
);
