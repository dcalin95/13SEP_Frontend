const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

let simulationInterval = null;
let isSimulating = false;

// Funcție pentru generarea unei tranzacții simulate
const generateSimulatedTransaction = () => {
  const usd = Math.floor(Math.random() * 50000) + 1000; // Între $1,000 și $50,000
  const bits = Math.floor(usd * 100); // 1 BITS = $0.01
  return { usd, bits };
};

// Endpoint pentru pornirea simulării
router.post('/start', async (req, res) => {
  const { adminPass } = req.body;

  if (adminPass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (isSimulating) {
    return res.status(400).json({ error: 'Simulation already running' });
  }

  isSimulating = true;
  console.log('🧪 Starting simulation...');

  simulationInterval = setInterval(async () => {
    try {
      const { usd, bits } = generateSimulatedTransaction();
      
      // Facem request către endpoint-ul de simulare
      const response = await axios.post(`${API_URL}/api/presale/simulate`, {
        amount: bits,
        usd: usd
      });

      console.log(`🧪 Simulated transaction: +$${usd.toFixed(2)} / +${bits} BITS`);
      console.log(`📊 Current state: Round ${response.data.roundNumber}, ${response.data.tokensAvailable} tokens remaining`);
    } catch (error) {
      console.error('❌ Error in simulation:', error.message);
      if (error.response?.status === 400) {
        console.log('🛑 Simulation stopped: Round ended or no tokens available');
        stopSimulation();
      }
    }
  }, 1000); // La fiecare secundă

  res.json({ message: 'Simulation started' });
});

// Endpoint pentru oprirea simulării
router.post('/stop', (req, res) => {
  const { adminPass } = req.body;

  if (adminPass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!isSimulating) {
    return res.status(400).json({ error: 'No simulation running' });
  }

  stopSimulation();
  res.json({ message: 'Simulation stopped' });
});

// Funcție helper pentru oprirea simulării
const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  isSimulating = false;
  console.log('🛑 Simulation stopped');
};

module.exports = router; 