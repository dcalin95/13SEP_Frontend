import React from 'react';
import PaperTradingSimulator from './PaperTradingSimulator';
import './PaperTradingPageStyles.css';

const PaperTradingPage = () => {
  return (
    <div className="paper-trading-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            🎮 Paper Trading Simulator
          </h1>
          <p className="page-subtitle">
            Practice crypto trading with virtual money and real market data
          </p>
          <div className="header-badges">
            <span className="badge">Virtual $1000</span>
            <span className="badge">Live Prices</span>
            <span className="badge">Zero Risk</span>
            <span className="badge">Real Experience</span>
          </div>
        </div>
      </div>

      {/* Main Simulator */}
      <div className="simulator-container">
        <PaperTradingSimulator />
      </div>

      {/* Info Footer */}
      <div className="info-footer">
        <div className="info-grid">
          <div className="info-item">
            <h3>🔥 How It Works</h3>
            <p>Start with $1000 virtual money, trade at real market prices, track your portfolio performance in real-time.</p>
          </div>
          <div className="info-item">
            <h3>📊 Live Data</h3>
            <p>All prices are updated every 30 seconds using real market data. Experience actual market volatility.</p>
          </div>
          <div className="info-item">
            <h3>🚀 Ready for Real Trading</h3>
            <p>Once you're confident with your strategies, seamlessly transition to real money trading.</p>
          </div>
          <div className="info-item">
            <h3>🤖 AI Trading Coming Soon</h3>
            <p>Let AI analyze market trends and execute trades automatically based on your preferences.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTradingPage;

