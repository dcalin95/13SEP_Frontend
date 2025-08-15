# FF Backend

## Structura Proiectului
```
backend/
├── routes/              # Rute API
├── services/           # Servicii și logica de business
├── scripts/            # Scripturi utilitare
├── simulation/         # Logica de simulare
├── telegram-bot/       # Bot Telegram
├── telegram-ai-bot/    # Bot AI Telegram
├── nowpayments/        # Integrare NowPayments
├── openai/            # Integrare OpenAI
└── logs/              # Loguri
```

## Configurare
1. Instalează dependențele:
```bash
npm install
```

2. Configurează variabilele de mediu:
- Creează un fișier `.env` cu următoarele variabile:
  - `PORT=3001`
  - `ADMIN_PASS=your_admin_password`
  - Alte credențiale necesare pentru servicii externe

3. Pornește serverul:
```bash
npm start
```

## Componente Principale

### Presale
- Gestionarea rundelor de presale
- Simularea tranzacțiilor
- Tracking progres

### Bot-uri Telegram
- `telegram-bot/` - Bot pentru notificări și comenzi
- `telegram-ai-bot/` - Bot cu integrare AI

### Servicii Externe
- NowPayments - Procesare plăți
- OpenAI - Integrare AI

## Scripturi Disponibile
- `npm start` - Pornește serverul
- `npm run start-worker` - Pornește worker-ul
- `start-all.bat` - Pornește toate serviciile

## API Endpoints
- `/api/presale/current` - Starea curentă presale
- `/api/presale/start-round` - Pornește o rundă nouă
- `/api/presale/end-round` - Încheie runda curentă
- `/api/presale/simulate` - Simulează tranzacții

## Baze de Date
- SQLite (`database.db`)
- Prisma pentru ORM

## Logging
- Logurile se găsesc în directorul `logs/`
- Format: `YYYY-MM-DD.log` 