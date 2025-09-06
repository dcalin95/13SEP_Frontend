# 🕒 Telegram Reward Cron

This script (`telegram-reward-cron.js`) is a background worker designed to reward Telegram users based on their time spent being active in your community.

---

## 🔧 What it does

- Tracks users' active time (based on messages sent in the Telegram bot)
- At every run, checks who has accumulated at least X seconds (default: 18000 = 5 hours)
- Calculates rewards proportionally (default: 10 BITS/hour)
- Calls the `setTelegramReward(address, amount)` function on the `TelegramRewardContract`
- Resets the timer after a successful reward

---

## 🧱 Structure

- `telegram-reward-cron.js` — Cron logic & reward distribution
- `database.js` — Stores Telegram activity and timers
- `TelegramReward.json` — ABI for the smart contract

---

## ⚙️ Environment Variables (`.env`)

```env
# Blockchain config
RPC_URL=https://your-node-url
REWARD_CONTRACT_ADDRESS=0xYourContractAddress
BACKEND_PRIVATE_KEY=0xYourPrivateKey

# Optional: token info
BITS_TOKEN_ADDRESS=0xYourBITS
STAKING_CONTRACT_ADDRESS=0xYourStaking

# Telegram bot config
TELEGRAM_BOT_TOKEN=your_bot_token

# Reward config
REWARD_RATE_PER_HOUR=10
REWARD_MIN_SECONDS=18000
