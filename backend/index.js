const express = require('express');
const cors = require('cors');
const { PORT } = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/presale', require('./presale'));
app.use('/api/simulation', require('./simulation'));
app.use('/api/manual-simulation', require('./routes/manualSimulation')); // 🆕 ADĂUGATĂ

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
