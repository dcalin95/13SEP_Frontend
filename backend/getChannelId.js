require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BROADCAST_BOT_TOKEN, { polling: true });

bot.on("message", (msg) => {
  console.log("📥 Mesaj primit de la:");
  console.log("🆔 Chat ID:", msg.chat.id);
  console.log("👥 Chat Title / Name:", msg.chat.title || msg.chat.username || msg.chat.first_name);
  console.log("🗂 Tip chat:", msg.chat.type);

  bot.sendMessage(msg.chat.id, `✅ Chat ID-ul acestui grup este:\n\`${msg.chat.id}\``, {
    parse_mode: "Markdown",
  });
});
