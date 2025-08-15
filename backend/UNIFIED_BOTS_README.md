# 🤖 UNIFIED BOTS SERVICE

## **DESCRIERE:**
Serviciu unificat care rulează **AMBELE** bot-uri Telegram în același serviciu Render pentru a economisi costuri.

## **🤖 BOT-URI INCLUSE:**

### **1. SIMPLE BOT** (User Tracking + Automated Messages)
- **Locație:** `telegram-bot-repo/simple-bot.js`
- **Funcții:**
  - Tracking utilizatori în PostgreSQL
  - Comenzi: `/register`, `/price`, `/cell`, `/stats`, `/activity`, `/myreward`
  - Mesaje automate la 5 minute cu date din frontend
  - Răspunsuri simple la mesaje (fără AI)

### **2. AI BOT** (OpenAI + BITS Documentation)
- **Locație:** `telegram-ai-bot/bot.js`
- **Funcții:**
  - Răspunsuri AI bazate pe documentația BITS
  - Integrare cu OpenAI GPT-3.5-turbo
  - Cunoștințe despre prețuri, tokenomics, roadmap
  - Moderare conținut (detectare cuvinte interzise)

## **🚀 DEPLOYMENT:**

### **Render Configuration:**
```yaml
# 🤖 Worker: Unified Bots Service ($7/lună)
- type: worker
  name: unified-bots-service
  startCommand: node unified-bots.js
  envVars:
    - TELEGRAM_BOT_TOKEN: "7094285105:AAHLMP_ITMBNgug1xvYtp45B0aYw6aRzvDM"
    - TELEGRAM_AI_BOT_TOKEN: "7094285105:AAHLMP_ITMBNgug1xvYtp45B0aYw6aRzvDM"
    - OPENAI_API_KEY: [set in Render dashboard]
    - DATABASE_PASSWORD: [set in Render dashboard]
```

### **Cost:**
- **$7/lună** pentru 1 serviciu worker
- **Economie:** $7/lună (vs 2 servicii separate)

## **🔧 FUNCȚIONARE:**

### **Procese Paralele:**
1. **Simple Bot Process:** Rulează `telegram-bot-repo/simple-bot.js`
2. **AI Bot Process:** Rulează `telegram-ai-bot/bot.js`

### **Graceful Shutdown:**
- Ambele procese se opresc corect la SIGTERM/SIGINT
- Conexiuni la baza de date închise corect

## **📊 MONITORING:**

### **Logs:**
```
🚀 UNIFIED BOTS SERVICE STARTING...
📡 Starting Simple Bot (User Tracking + Commands + Auto Messages)...
🧠 Starting AI Bot (OpenAI + BITS Documentation)...
✅ UNIFIED BOTS SERVICE STARTED!
```

### **Status:**
- Simple Bot: User tracking, commands, automated messages
- AI Bot: OpenAI responses about BITS project
- Total Cost: $7/month (1 Render worker)

## **🔮 VIITOR:**

### **Cron Tasks (Adăugare ulterioară):**
- Monitorizare plăți Solana
- Rapoarte automate
- Alerte preț

### **Scaling:**
- Posibilitate de a adăuga mai multe bot-uri
- Load balancing între procese
- Health checks

## **🚀 COMENZI:**

```bash
# Test local
node unified-bots.js

# Deploy pe Render
git push origin main
```

## **✅ BENEFICII:**

1. **Cost Redus:** $7/lună vs $14/lună
2. **Management Simplu:** 1 serviciu vs 2 servicii
3. **Deployment Unificat:** O singură configurație
4. **Monitoring Centralizat:** Logs în același loc
5. **Scalabilitate:** Ușor de extins cu cron tasks

---

**🎯 REZULTAT:** 2 bot-uri funcționale în 1 serviciu Render la $7/lună! 