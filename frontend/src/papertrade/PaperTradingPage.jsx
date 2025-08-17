import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import STXPaperTrade from './STXPaperTrade';
import TokenPaperTrade from './TokenPaperTrade';
import './PaperTradingPage.css';

const PaperTradingPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabChange = (tabName) => {
    console.log('Changing tab to:', tabName);
    setActiveTab(tabName);
  };

  return (
    <div className="paper-trading-container">
      <div className="paper-trading-header">
        <h1>
          <i className="fas fa-gamepad"></i>
          Paper Trading Platform
          <span className="beta-badge">BETA</span>
        </h1>
        <p>Practice trading without risking real money</p>
      </div>

      <div className="trading-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
          title="Current tab: Overview"
        >
          <i className="fas fa-chart-line"></i>
          Overview
          {activeTab === 'overview' && <span className="active-indicator">●</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'stx' ? 'active' : ''}`}
          onClick={() => handleTabChange('stx')}
          title="Current tab: STX Trading"
        >
          <i className="fab fa-bitcoin"></i>
          STX Trading
          {activeTab === 'stx' && <span className="active-indicator">●</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => handleTabChange('tokens')}
          title="Current tab: Token Trading"
        >
          <i className="fas fa-coins"></i>
          Token Trading
          {activeTab === 'tokens' && <span className="active-indicator">●</span>}
        </button>
      </div>

      <div className="trading-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="trading-cards">
              <div className="trading-card">
                <div className="card-icon">
                  <i className="fab fa-bitcoin"></i>
                </div>
                <h3>STX Paper Trading</h3>
                <p>Practice trading Stacks (STX) with real-time price feeds</p>
                <div className="card-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => handleTabChange('stx')}
                  >
                    Start STX Trading
                  </button>
                  <Link to="/paper-trade/stx" className="btn-secondary">
                    Direct Link
                  </Link>
                </div>
              </div>

              <div className="trading-card">
                <div className="card-icon">
                  <i className="fas fa-coins"></i>
                </div>
                <h3>Token Paper Trading</h3>
                <p>Practice trading various tokens with simulated portfolios</p>
                <div className="card-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => handleTabChange('tokens')}
                  >
                    Start Token Trading
                  </button>
                  <Link to="/paper-trade/BITS" className="btn-secondary">
                    Trade BITS
                  </Link>
                </div>
              </div>
            </div>

            <div className="features-section">
              <h3>Paper Trading Features</h3>
              <div className="features-grid">
                <div className="feature-item">
                  <i className="fas fa-chart-area"></i>
                  <h4>Real-time Data</h4>
                  <p>Practice with live market data</p>
                </div>
                <div className="feature-item">
                  <i className="fas fa-wallet"></i>
                  <h4>Virtual Portfolio</h4>
                  <p>$10,000 starting balance</p>
                </div>
                <div className="feature-item">
                  <i className="fas fa-history"></i>
                  <h4>Trade History</h4>
                  <p>Track your performance</p>
                </div>
                <div className="feature-item">
                  <i className="fas fa-trophy"></i>
                  <h4>Risk-Free Learning</h4>
                  <p>Learn without losing money</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stx' && (
          <div className="stx-trading-section">
            <div className="trading-header-controls">
              <button 
                className="back-to-overview-btn"
                onClick={() => handleTabChange('overview')}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Overview
              </button>
            </div>
            <STXPaperTrade />
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="token-trading-section">
            <div className="trading-header-controls">
              <button 
                className="back-to-overview-btn"
                onClick={() => handleTabChange('overview')}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Overview
              </button>
            </div>
            <TokenPaperTrade />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperTradingPage;
