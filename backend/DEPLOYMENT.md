# 🚀 Deployment Guide pentru Render

## 📋 Configurare Render pentru Bot-ul Integrat

### 1. **Structura Serviciilor în Render**

#### **Servicii Existente:**
- **backend-server** (web) - API principal
- **telegram-bot-worker** (worker) - Bot vechi (backup)
- **simulate-sales-worker** (worker) - Simulare vânzări
- **telegram-reward-cron** (worker) - Cron jobs

#### **Serviciu Nou:**
- **telegram-bot-integrated** (worker) - Bot integrat cu monitoring, automatizare și blockchain

### 2. **Variabile de Mediu Necesare**

#### **Pentru telegram-bot-integrated:**
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=your_channel_id
TELEGRAM_ADMIN_CHANNEL_ID=your_admin_channel_id
TELEGRAM_ADMIN_CHAT_ID=your_admin_chat_id

# Database (folosește aceeași DB ca backend-server)
DATABASE_PATH=./database.db

# Ethereum Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your_project_id
ADMIN_PRIVATE_KEY=your_admin_private_key

# Contract Addresses
TELEGRAM_REWARD_CONTRACT_ADDRESS=0x...
CELL_MANAGER_CONTRACT_ADDRESS=0x...
BITS_TOKEN_CONTRACT_ADDRESS=0x...
```

### 3. **Pași de Deployment**

#### **Pasul 1: Pregătire Git**
```bash
# În directorul backend
git add .
git commit -m "Add integrated Telegram bot with monitoring, automation and blockchain"
git push origin main
```

#### **Pasul 2: Configurare Render**
1. Mergi la dashboard-ul Render
2. Creează un nou serviciu worker
3. Conectează repository-ul Git
4. Configurează variabilele de mediu
5. Setează build command: `npm install`
6. Setează start command: `node telegram-bot/index.js`

#### **Pasul 3: Verificare Deployment**
1. Verifică log-urile în Render
2. Testează bot-ul cu comanda `/start`
3. Verifică funcționalitățile:
   - `/activity` - tracking activitate
   - `/myreward` - verificare recompense
   - `/adminreport` - raport admin

### 4. **Migrarea de la Bot-ul Vechi**

#### **Opțiunea A: Rulare Paralelă (Recomandată)**
- Păstrează `telegram-bot-worker` (bot vechi)
- Adaugă `telegram-bot-integrated` (bot nou)
- Testează ambele în paralel
- Dezactivează bot-ul vechi după testare

#### **Opțiunea B: Înlocuire Directă**
- Modifică `telegram-bot-worker` să ruleze `node telegram-bot/index.js`
- Actualizează variabilele de mediu
- Testează funcționalitatea

### 5. **Verificări Post-Deployment**

#### **Testare Funcționalități:**
```bash
# Comenzi de bază
/start - Înregistrare utilizator
/help - Ghid comenzi
/activity - Verifică activitatea

# Sistem de recompense
/myreward - Verifică recompensele
/claimreward - Revendică recompense
/wallet <address> - Înregistrează wallet

# Staking și blockchain
/balance - Verifică soldul
/staking - Informații staking
/stake <amount> - Stake tokeni
/unstake <amount> - Unstake tokeni

# Admin commands
/adminreport - Raport monitoring
/adminstatus - Status sistem
```

#### **Verificări Sistem:**
- ✅ Bot răspunde la comenzi
- ✅ Tracking activitate funcționează
- ✅ Baza de date este accesibilă
- ✅ Conexiune blockchain funcționează
- ✅ Alert-uri automate se trimit

### 6. **Monitoring și Logs**

#### **Log-uri Importante:**
- `🚀 Initializing Telegram Bot Manager...`
- `✅ Monitoring System initialized`
- `✅ Automation System initialized`
- `✅ Blockchain Integration initialized`
- `✅ Telegram Bot Manager initialized successfully`

#### **Alert-uri de Verificat:**
- Utilizatori noi eligibili pentru recompense
- Rapoarte săptămânale de activitate
- Distribuție automată de recompense lunare
- Erori blockchain sau tranzacții

### 7. **Troubleshooting**

#### **Probleme Comune:**

**1. Bot nu răspunde:**
- Verifică `TELEGRAM_BOT_TOKEN`
- Verifică log-urile în Render
- Testează cu `/start`

**2. Erori de bază de date:**
- Verifică că `database.db` există
- Verifică permisiunile de citire/scriere
- Verifică că tabelele sunt create

**3. Erori blockchain:**
- Verifică `ETHEREUM_RPC_URL`
- Verifică `ADMIN_PRIVATE_KEY`
- Verifică adresele contractelor

**4. Erori de monitoring:**
- Verifică variabilele de mediu pentru canale
- Verifică permisiunile bot-ului în canale
- Verifică log-urile pentru erori

### 8. **Backup și Recuperare**

#### **Backup Baza de Date:**
```bash
# În Render, descarcă database.db
# Sau folosește backup automat din Render
```

#### **Rollback Plan:**
1. Păstrează bot-ul vechi activ
2. Testează bot-ul nou complet
3. Dezactivează bot-ul vechi doar după confirmare
4. Monitorizează performanța 24/7

---

**Status:** Gata pentru deployment  
**Ultima actualizare:** Decembrie 2024  
**Versiune:** 1.0.0 