require("dotenv").config();
const { spawn } = require('child_process');
const path = require('path');

console.log("🚀 UNIFIED BOTS SERVICE STARTING...");
console.log("🤖 Running both Simple Bot + AI Bot in single Render service");
console.log("💰 Cost: $7/month (1 worker service)");

// 🔧 Configuration
const SIMPLE_BOT_PATH = path.join(__dirname, 'telegram-bot-repo', 'simple-bot.js');
const AI_BOT_PATH = path.join(__dirname, 'telegram-ai-bot', 'bot.js');

// 🚀 Start Simple Bot (User Tracking + Automated Messages)
console.log("📡 Starting Simple Bot (User Tracking + Commands + Auto Messages)...");
const simpleBot = spawn('node', [SIMPLE_BOT_PATH], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
  }
});

simpleBot.on('error', (error) => {
  console.error('❌ Simple Bot error:', error);
});

simpleBot.on('exit', (code) => {
  console.log(`🛑 Simple Bot exited with code ${code}`);
});

// 🚀 Start AI Bot (OpenAI Responses)
console.log("🧠 Starting AI Bot (OpenAI + BITS Documentation)...");
const aiBot = spawn('node', [AI_BOT_PATH], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    TELEGRAM_AI_BOT_TOKEN: process.env.TELEGRAM_AI_BOT_TOKEN
  }
});

aiBot.on('error', (error) => {
  console.error('❌ AI Bot error:', error);
});

aiBot.on('exit', (code) => {
  console.log(`🛑 AI Bot exited with code ${code}`);
});

// 🛑 Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down unified bots...');
  simpleBot.kill('SIGTERM');
  aiBot.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down unified bots...');
  simpleBot.kill('SIGINT');
  aiBot.kill('SIGINT');
  process.exit(0);
});

console.log("✅ UNIFIED BOTS SERVICE STARTED!");
console.log("📋 Simple Bot: User tracking, commands, automated messages");
console.log("🧠 AI Bot: OpenAI responses about BITS project");
console.log("💰 Total Cost: $7/month (1 Render worker)"); 