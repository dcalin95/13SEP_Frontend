require('dotenv').config();
console.log("🟢 [WORKER] Starting BitSwap Background Worker...");

// 🔁 PORNEȘTE BOTUL TELEGRAM
require("./telegram-bot/bot.js");

// 🔁 PORNEȘTE CRONUL DE VERIFICARE TRANZACȚII
const cron = require("node-cron");
const verifyAll = require("./tasks/verifyAllMissingTx");

cron.schedule("*/5 * * * *", async () => {
  console.log("⏰ [CRON] Running verifyAllMissingTx.js...");
  await verifyAll();
});
