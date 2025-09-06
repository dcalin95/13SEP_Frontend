const { exec } = require("child_process");

console.log("✅ Pornim backend-ul Express...");
exec("start cmd /k \"cd /d C:\\Users\\cezar\\Desktop\\1234 && node server.js\"");

setTimeout(() => {
  console.log("🤖 Pornim Telegram AI bot...");
  exec("start cmd /k \"cd /d C:\\Users\\cezar\\Desktop\\1234 && node openai\\telegram-ai.js\"");
}, 2000);
