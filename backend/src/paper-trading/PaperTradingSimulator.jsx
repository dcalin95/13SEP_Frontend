import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './PaperTradingStyles.css';

const COINMARKETCAP_API_KEY = process.env.REACT_APP_COINMARKETCAP_API_KEY || 'demo-key';
const COINMARKETCAP_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

// Popular crypto symbols for trading
const AVAILABLE_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', id: 1 },
  { symbol: 'ETH', name: 'Ethereum', id: 1027 },
  { symbol: 'STX', name: 'Stacks', id: 4847 },
  { symbol: 'ALEX', name: 'ALEX', id: 17219 },
  { symbol: 'ADA', name: 'Cardano', id: 2010 },
  { symbol: 'SOL', name: 'Solana', id: 5426 },
  { symbol: 'MATIC', name: 'Polygon', id: 3890 },
  { symbol: 'USDC', name: 'USD Coin', id: 3408 }
];

const PaperTradingSimulator = () => {
  // Portfolio state
  const [virtualBalance, setVirtualBalance] = useState(1000); // Start with $1000
  const [holdings, setHoldings] = useState({}); // { BTC: { amount: 0.01, avgPrice: 95000 } }
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(1000);
  const [totalPnL, setTotalPnL] = useState(0);
  
  // Market data
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Trading
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [tradeHistory, setTradeHistory] = useState([]);
  
  // Error handling
  const [error, setError] = useState('');
  
  // Refs
  const priceUpdateInterval = useRef(null);

  // Fetch live crypto prices from CoinMarketCap
  const fetchCryptoPrices = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all crypto IDs for the API call
      const cryptoIds = AVAILABLE_CRYPTOS.map(crypto => crypto.id).join(',');
      
      // For demo purposes, we'll use a mock API or fallback prices
      // In production, you would use the real CoinMarketCap API
      const mockPrices = {
        1: { symbol: 'BTC', quote: { USD: { price: 95000 + (Math.random() - 0.5) * 1000 } } },
        1027: { symbol: 'ETH', quote: { USD: { price: 3500 + (Math.random() - 0.5) * 100 } } },
        4847: { symbol: 'STX', quote: { USD: { price: 2.50 + (Math.random() - 0.5) * 0.1 } } },
        17219: { symbol: 'ALEX', quote: { USD: { price: 0.30 + (Math.random() - 0.5) * 0.02 } } },
        2010: { symbol: 'ADA', quote: { USD: { price: 1.20 + (Math.random() - 0.5) * 0.05 } } },
        5426: { symbol: 'SOL', quote: { USD: { price: 180 + (Math.random() - 0.5) * 10 } } },
        3890: { symbol: 'MATIC', quote: { USD: { price: 1.10 + (Math.random() - 0.5) * 0.05 } } },
        3408: { symbol: 'USDC', quote: { USD: { price: 1.00 } } }
      };
      
      // Convert to our format
      const pricesData = {};
      Object.values(mockPrices).forEach(crypto => {
        pricesData[crypto.symbol] = {
          price: crypto.quote.USD.price,
          change24h: (Math.random() - 0.5) * 10 // Random percentage change
        };
      });
      
      setCryptoPrices(pricesData);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Failed to fetch live prices. Using demo data.');
      
      // Fallback demo prices
      const demoPrices = {
        BTC: { price: 95000, change24h: 2.5 },
        ETH: { price: 3500, change24h: -1.2 },
        STX: { price: 2.50, change24h: 5.8 },
        ALEX: { price: 0.30, change24h: -2.1 },
        ADA: { price: 1.20, change24h: 3.2 },
        SOL: { price: 180, change24h: 4.5 },
        MATIC: { price: 1.10, change24h: -0.8 },
        USDC: { price: 1.00, change24h: 0.0 }
      };
      setCryptoPrices(demoPrices);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  // Calculate total portfolio value
  const calculatePortfolioValue = () => {
    let totalValue = virtualBalance;
    
    Object.entries(holdings).forEach(([symbol, holding]) => {
      const currentPrice = cryptoPrices[symbol]?.price || 0;
      totalValue += holding.amount * currentPrice;
    });
    
    setTotalPortfolioValue(totalValue);
    setTotalPnL(totalValue - 1000); // Compare to initial $1000
  };

  // Execute trade
  const executeTrade = () => {
    const amount = parseFloat(tradeAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const currentPrice = cryptoPrices[selectedCrypto]?.price;
    if (!currentPrice) {
      setError('Price data not available');
      return;
    }

    if (tradeType === 'buy') {
      // Buy crypto
      const totalCost = amount; // Amount in USD
      const cryptoAmount = totalCost / currentPrice;
      
      if (totalCost > virtualBalance) {
        setError('Insufficient balance');
        return;
      }
      
      // Update balance
      setVirtualBalance(prev => prev - totalCost);
      
      // Update holdings
      setHoldings(prev => {
        const currentHolding = prev[selectedCrypto] || { amount: 0, avgPrice: 0 };
        const newAmount = currentHolding.amount + cryptoAmount;
        const newAvgPrice = ((currentHolding.amount * currentHolding.avgPrice) + (cryptoAmount * currentPrice)) / newAmount;
        
        return {
          ...prev,
          [selectedCrypto]: {
            amount: newAmount,
            avgPrice: newAvgPrice
          }
        };
      });
      
      // Add to trade history
      const trade = {
        id: Date.now(),
        type: 'BUY',
        symbol: selectedCrypto,
        amount: cryptoAmount,
        price: currentPrice,
        total: totalCost,
        timestamp: new Date()
      };
      setTradeHistory(prev => [trade, ...prev]);
      
    } else {
      // Sell crypto
      const cryptoAmount = amount; // Amount in crypto units
      const currentHolding = holdings[selectedCrypto];
      
      if (!currentHolding || cryptoAmount > currentHolding.amount) {
        setError('Insufficient crypto balance');
        return;
      }
      
      const totalReceived = cryptoAmount * currentPrice;
      
      // Update balance
      setVirtualBalance(prev => prev + totalReceived);
      
      // Update holdings
      setHoldings(prev => {
        const newAmount = currentHolding.amount - cryptoAmount;
        if (newAmount <= 0.00000001) {
          const { [selectedCrypto]: removed, ...rest } = prev;
          return rest;
        }
        
        return {
          ...prev,
          [selectedCrypto]: {
            ...currentHolding,
            amount: newAmount
          }
        };
      });
      
      // Add to trade history
      const trade = {
        id: Date.now(),
        type: 'SELL',
        symbol: selectedCrypto,
        amount: cryptoAmount,
        price: currentPrice,
        total: totalReceived,
        timestamp: new Date()
      };
      setTradeHistory(prev => [trade, ...prev]);
    }
    
    setTradeAmount('');
    setError('');
  };

  // Initialize and set up price updates
  useEffect(() => {
    fetchCryptoPrices();
    
    // Update prices every 30 seconds
    priceUpdateInterval.current = setInterval(fetchCryptoPrices, 30000);
    
    return () => {
      if (priceUpdateInterval.current) {
        clearInterval(priceUpdateInterval.current);
      }
    };
  }, []);

  // Recalculate portfolio value when prices or holdings change
  useEffect(() => {
    calculatePortfolioValue();
  }, [cryptoPrices, holdings, virtualBalance]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatCrypto = (amount, symbol) => {
    const decimals = amount < 1 ? 8 : 4;
    return `${amount.toFixed(decimals)} ${symbol}`;
  };

  return (
    <div className="paper-trading-simulator">
      {/* Header */}
      <div className="trading-header">
        <h1>🎮 Paper Trading Simulator</h1>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">Virtual Balance</span>
            <span className="stat-value">{formatCurrency(virtualBalance)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Portfolio Value</span>
            <span className="stat-value">{formatCurrency(totalPortfolioValue)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total P&L</span>
            <span className={`stat-value ${totalPnL >= 0 ? 'profit' : 'loss'}`}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </span>
          </div>
        </div>
        {lastUpdate && (
          <div className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="trading-main">
        {/* Price Dashboard */}
        <div className="price-dashboard">
          <h2>📊 Live Prices</h2>
          <div className="crypto-grid">
            {AVAILABLE_CRYPTOS.map(crypto => {
              const priceData = cryptoPrices[crypto.symbol];
              if (!priceData) return null;
              
              return (
                <div
                  key={crypto.symbol}
                  className={`crypto-card ${selectedCrypto === crypto.symbol ? 'selected' : ''}`}
                  onClick={() => setSelectedCrypto(crypto.symbol)}
                >
                  <div className="crypto-header">
                    <span className="crypto-symbol">{crypto.symbol}</span>
                    <span className="crypto-name">{crypto.name}</span>
                  </div>
                  <div className="crypto-price">
                    {formatCurrency(priceData.price)}
                  </div>
                  <div className={`crypto-change ${priceData.change24h >= 0 ? 'positive' : 'negative'}`}>
                    {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
          {loading && <div className="loading">🔄 Updating prices...</div>}
        </div>

        {/* Trading Panel */}
        <div className="trading-panel">
          <h2>💰 Trade {selectedCrypto}</h2>
          <div className="current-price">
            Current Price: {cryptoPrices[selectedCrypto] ? formatCurrency(cryptoPrices[selectedCrypto].price) : 'Loading...'}
          </div>
          
          <div className="trade-controls">
            <div className="trade-type-selector">
              <button
                className={`trade-type-btn ${tradeType === 'buy' ? 'active' : ''}`}
                onClick={() => setTradeType('buy')}
              >
                🟢 BUY
              </button>
              <button
                className={`trade-type-btn ${tradeType === 'sell' ? 'active' : ''}`}
                onClick={() => setTradeType('sell')}
              >
                🔴 SELL
              </button>
            </div>
            
            <div className="amount-input">
              <label>
                {tradeType === 'buy' ? 'Amount (USD)' : `Amount (${selectedCrypto})`}
              </label>
              <input
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                placeholder={tradeType === 'buy' ? '100.00' : '0.001'}
                step={tradeType === 'buy' ? '1' : '0.00000001'}
                min="0"
              />
            </div>
            
            <button className="execute-trade-btn" onClick={executeTrade}>
              {tradeType === 'buy' ? '🟢 BUY' : '🔴 SELL'} {selectedCrypto}
            </button>
            
            {tradeType === 'sell' && holdings[selectedCrypto] && (
              <div className="available-balance">
                Available: {formatCrypto(holdings[selectedCrypto].amount, selectedCrypto)}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Holdings */}
        <div className="portfolio-holdings">
          <h2>💼 Your Holdings</h2>
          {Object.keys(holdings).length === 0 ? (
            <div className="no-holdings">No crypto holdings yet. Start trading!</div>
          ) : (
            <div className="holdings-list">
              {Object.entries(holdings).map(([symbol, holding]) => {
                const currentPrice = cryptoPrices[symbol]?.price || 0;
                const currentValue = holding.amount * currentPrice;
                const pnl = currentValue - (holding.amount * holding.avgPrice);
                const pnlPercentage = holding.avgPrice > 0 ? ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100 : 0;
                
                return (
                  <div key={symbol} className="holding-item">
                    <div className="holding-header">
                      <span className="holding-symbol">{symbol}</span>
                      <span className="holding-amount">{formatCrypto(holding.amount, symbol)}</span>
                    </div>
                    <div className="holding-details">
                      <div className="holding-detail">
                        <span>Avg Price:</span>
                        <span>{formatCurrency(holding.avgPrice)}</span>
                      </div>
                      <div className="holding-detail">
                        <span>Current Price:</span>
                        <span>{formatCurrency(currentPrice)}</span>
                      </div>
                      <div className="holding-detail">
                        <span>Value:</span>
                        <span>{formatCurrency(currentValue)}</span>
                      </div>
                      <div className="holding-detail">
                        <span>P&L:</span>
                        <span className={pnl >= 0 ? 'profit' : 'loss'}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trade History */}
        <div className="trade-history">
          <h2>📝 Trade History</h2>
          {tradeHistory.length === 0 ? (
            <div className="no-trades">No trades yet</div>
          ) : (
            <div className="trades-list">
              {tradeHistory.slice(0, 10).map(trade => (
                <div key={trade.id} className={`trade-item ${trade.type.toLowerCase()}`}>
                  <div className="trade-type">{trade.type}</div>
                  <div className="trade-details">
                    <span>{formatCrypto(trade.amount, trade.symbol)}</span>
                    <span>@ {formatCurrency(trade.price)}</span>
                    <span>{formatCurrency(trade.total)}</span>
                  </div>
                  <div className="trade-time">
                    {trade.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaperTradingSimulator;

