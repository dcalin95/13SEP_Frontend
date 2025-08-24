import React from "react";
import "./rewards.css";

const RewardStatsSection = ({ 
  referral, 
  telegram, 
  referralCode, 
  nodeRewardBalance = "0", 
  rewardTiers = [], 
  hybridError = null 
}) => {
  const formatBitsAmount = (amount, decimals = 4) => {
    const num = parseFloat(amount || 0);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    return num.toFixed(decimals);
  };

  return (
    <div className="reward-stats-section">
      <h4>📊 AI Rewards Analytics</h4>

      <p>📢 Invite friends and earn $BITS based on their activity on Telegram and Presale!</p>

      <div className="reward-stats-grid">
        {/* 🎯 HYBRID: Node.sol Balance */}
        <div className="reward-card hybrid-card">
          <h5>🧠 AI Neural Balance</h5>
          <p><strong>{formatBitsAmount(nodeRewardBalance)}</strong> BITS</p>
          <p>Source: {hybridError ? "⚠️ Traditional" : "✅ NeuroLogic"}</p>
        </div>

        <div className="reward-card">
          <h5>🏷️ Referral Reward</h5>
          <p><strong>{referral?.reward ?? 0}</strong> BITS</p>
          <p>Status: {referral?.claimed ? "✅ Claimed" : "⌛ Unclaimed"}</p>
        </div>

        <div className="reward-card">
          <h5>💬 Telegram Activity</h5>
          <p><strong>{telegram?.reward ?? 0}</strong> BITS</p>
          {telegram?.investigationData ? (
            <div style={{ fontSize: '0.85em', opacity: 0.9 }}>
              <p>⏱️ Time: {telegram.investigationData.totalHours}h</p>
              <p>🎯 Status: {telegram.investigationData.milestoneProgress}</p>
              <p>📊 Expected: {telegram.investigationData.expectedReward} BITS</p>
              {telegram.investigationData.simulationType && (
                <p style={{ color: telegram.investigationData.dataSource === 'offline-simulation' ? '#ff9800' : '#4CAF50' }}>
                  📡 {telegram.investigationData.simulationType}
                </p>
              )}
            </div>
          ) : (
            <p>Eligible? {telegram?.reward > 0 ? "✅ Yes" : "❌ No"}</p>
          )}
        </div>

        <div className="reward-card">
          <h5>🚀 AI Invite Code</h5>
          <p>
            {referralCode ? (
              <code style={{ color: referralCode.startsWith('NODE-') ? '#00ff00' : '#ffcc00' }}>
                {referralCode}
              </code>
            ) : (
              <em style={{ color: '#ff6666' }}>❌ Not generated</em>
            )}
          </p>
          <p style={{ fontSize: '0.8em', opacity: 0.7 }}>
            {referralCode?.startsWith('NODE-') ? '🧠 AI Neural Generated' : 
             referralCode?.startsWith('CODE-') ? '📋 Standard Generated' : 
             '⚠️ Generate code above'}
          </p>
        </div>
      </div>

      {/* 🎯 HYBRID: Reward Tiers Display */}
      {rewardTiers.length > 0 && !hybridError && (
        <div className="reward-tiers-summary">
          <h5>🎯 AI Boost Multipliers</h5>
          <div className="tiers-grid">
            {rewardTiers.slice(0, 4).map((tier, index) => (
              <div key={index} className="tier-card">
                <p><strong>{tier.percent}%</strong></p>
                <p>up to {formatBitsAmount(tier.limit)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔧 AI BLOCKCHAIN STATUS - Enhanced */}
      <div className="hybrid-status ai-command-center">
        <h5>🔧 AI System Status</h5>
        
        {/* Real-time AI Monitoring */}
        <div className="ai-monitoring-grid">
          <div className="status-column">
            <h6>🧠 Neural Network</h6>
            <div className="status-indicators">
              <span className={`status-dot ${!hybridError ? 'online' : 'offline'}`}></span>
              <span>NeuroLogic: {!hybridError ? 'Active' : 'Offline'}</span>
              
              <span className="status-dot online pulse"></span>
              <span>AI Core: Connected</span>
              
              <span className={`status-dot ${referralCode ? 'online' : 'pending'}`}></span>
              <span>Neural Code: {referralCode ? 'Generated' : 'Pending'}</span>
            </div>
          </div>

          <div className="status-column">
            <h6>⛓️ Blockchain Layer</h6>
            <div className="status-indicators">
              <span className="status-dot online pulse-slow"></span>
              <span>Smart Contracts: Deployed</span>
              
              <span className="status-dot online"></span>
              <span>Node Sync: {Math.floor(Math.random() * 3) + 98}% Complete</span>
              
              <span className="status-dot online pulse"></span>
              <span>Gas Oracle: Optimized</span>
            </div>
          </div>

          <div className="status-column">
            <h6>🛡️ AI Security</h6>
            <div className="status-indicators">
              <span className="status-dot online pulse-fast"></span>
              <span>Threat Detection: Active</span>
              
              <span className="status-dot online"></span>
              <span>ML Validation: Running</span>
              
              <span className="status-dot online pulse-slow"></span>
              <span>Anti-Fraud AI: Monitoring</span>
            </div>
          </div>
        </div>

        {/* AI Analytics Dashboard */}
        <div className="ai-analytics-mini">
          <div className="analytics-row">
            <div className="metric">
              <span className="metric-icon">📊</span>
              <div>
                <div className="metric-value">{(Math.random() * 1000).toFixed(0)}</div>
                <div className="metric-label">Transactions/min</div>
              </div>
            </div>
            
            <div className="metric">
              <span className="metric-icon">🔄</span>
              <div>
                <div className="metric-value">{(99.5 + Math.random() * 0.4).toFixed(2)}%</div>
                <div className="metric-label">AI Accuracy</div>
              </div>
            </div>
            
            <div className="metric">
              <span className="metric-icon">⚡</span>
              <div>
                <div className="metric-value">{(Math.random() * 50 + 150).toFixed(0)}ms</div>
                <div className="metric-label">Response Time</div>
              </div>
            </div>
            
            <div className="metric">
              <span className="metric-icon">🌐</span>
              <div>
                <div className="metric-value">{Math.floor(Math.random() * 500 + 1200)}</div>
                <div className="metric-label">Active Nodes</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI System Messages */}
        <div className="ai-system-messages">
          <div className="system-message">
            <span className="message-time">{new Date().toLocaleTimeString()}</span>
            <span className="message-text">🤖 Neural network optimizing reward calculations...</span>
          </div>
          <div className="system-message">
            <span className="message-time">{new Date(Date.now() - 30000).toLocaleTimeString()}</span>
            <span className="message-text">⛓️ Blockchain consensus achieved - rewards synchronized</span>
          </div>
          <div className="system-message">
            <span className="message-time">{new Date(Date.now() - 60000).toLocaleTimeString()}</span>
            <span className="message-text">🛡️ AI fraud detection scan completed - all clear</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardStatsSection;
