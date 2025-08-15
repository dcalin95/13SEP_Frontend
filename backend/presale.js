const express = require('express');
const router = express.Router();

// Starea inițială a presale-ului
let presaleState = {
  roundNumber: 1,
  price: 1,
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + 86400, // 24 ore
  tokensAvailable: 20000000,
  sold: 0,
  totalRaised: 0,
  progress: 0
};

// Endpoint pentru obținerea stării curente
router.get('/current', (req, res) => {
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Calculăm totalRaised din sold și price
  presaleState.totalRaised = (presaleState.sold * presaleState.price) / 100; // Convertim din cenți în dolari

  // Calculăm progresul
  presaleState.progress = (presaleState.sold / (20000000 - presaleState.tokensAvailable)) * 100;
  
  res.json(presaleState);
});

// Endpoint pentru simularea unei tranzacții
router.post('/simulate', (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // Calculăm câte token-uri putem vinde cu suma dată
  const tokensToSell = Math.floor(amount / presaleState.price);

  if (tokensToSell > presaleState.tokensAvailable) {
    return res.status(400).json({ error: 'Not enough tokens available' });
  }

  // Actualizăm starea
  presaleState.sold += tokensToSell;
  presaleState.tokensAvailable -= tokensToSell;
  presaleState.totalRaised = (presaleState.sold * presaleState.price) / 100; // Convertim din cenți în dolari
  presaleState.progress = (presaleState.sold / (20000000 - presaleState.tokensAvailable)) * 100;

  res.json(presaleState);
});

// Endpoint pentru resetarea stării
router.post('/reset', (req, res) => {
  presaleState = {
    roundNumber: 1,
    price: 1,
    startTime: Math.floor(Date.now() / 1000),
    endTime: Math.floor(Date.now() / 1000) + 86400,
    tokensAvailable: 20000000,
    sold: 0,
    totalRaised: 0,
    progress: 0
  };

  res.json({ message: 'Presale state reset successfully' });
});

module.exports = router; 