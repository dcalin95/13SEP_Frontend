import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ThankYouPage.css';

const ThankYouPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  // Extract parameters from URL
  const transactionHash = queryParams.get('tx') || queryParams.get('txHash');
  const bitsReceived = queryParams.get('bits') || queryParams.get('amount');
  const paymentMethod = queryParams.get('method') || 'Cryptocurrency';

  useEffect(() => {
    // 🚫 REMOVED: Google Ads conversion tracking for presale
    // ⚠️ Google Ads prohibits crypto presale/ICO advertising
    // Use this page only for non-presale conversions (newsletter, contact, etc.)

    // Auto redirect after 10 seconds
    const timer = setTimeout(() => {
      navigate('/presale');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="thank-you-container">
      <div className="thank-you-card">
        {/* 🎉 Success Header */}
        <div className="success-header">
          <div className="success-icon">✅</div>
          <h1>Thank You!</h1>
          <p className="success-subtitle">Your action was completed successfully</p>
        </div>

        {/* 📊 Transaction Details */}
        <div className="transaction-details">
          <div className="detail-row">
            <span className="detail-label">Payment Method:</span>
            <span className="detail-value">{paymentMethod}</span>
          </div>
          
          {bitsReceived && (
            <div className="detail-row">
              <span className="detail-label">BITS Received:</span>
              <span className="detail-value highlight">{bitsReceived} $BITS</span>
            </div>
          )}
          
          {transactionHash && (
            <div className="detail-row">
              <span className="detail-label">Transaction:</span>
              <span className="detail-value hash">{transactionHash}</span>
            </div>
          )}
          
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value success">✅ Confirmed</span>
          </div>
        </div>

        {/* 🚀 Next Steps */}
        <div className="next-steps">
          <h3>What's Next?</h3>
          <ul>
            <li>🎁 Check your <strong>Rewards Dashboard</strong> for bonus tokens</li>
            <li>📈 Monitor your investment in the <strong>AI Portfolio</strong></li>
            <li>🤝 Share your referral link to earn more rewards</li>
            <li>💰 Join our Telegram for the latest updates</li>
          </ul>
        </div>

        {/* 🔄 Navigation Buttons */}
        <div className="action-buttons">
          <button onClick={() => navigate('/rewards-hub')} className="btn-primary">
            🎁 View Rewards
          </button>
          <button onClick={() => navigate('/ai-portfolio')} className="btn-secondary">
            📈 AI Portfolio
          </button>
          <button onClick={() => navigate('/presale')} className="btn-outline">
            🔙 Back to Presale
          </button>
        </div>

        {/* ⏰ Auto Redirect Notice */}
        <div className="auto-redirect">
          <p>Redirecting to presale in 10 seconds...</p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
