import React, { useState, useEffect } from 'react';
import './MetaMaskInfoPopup.css';

const MetaMaskInfoPopup = ({ isOpen, onClose, onContinue }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
             window.innerWidth <= 768 ||
             ('ontouchstart' in window) ||
             (navigator.maxTouchPoints > 0);
    };
    
    setIsMobile(checkMobile());
  }, []);

  if (!isOpen) return null;

  return (
    <div className="metamask-popup-overlay" onClick={onClose}>
      <div className="metamask-popup" onClick={(e) => e.stopPropagation()}>
        <div className="metamask-popup-header">
          <h2>🦊 MetaMask Connection Guide</h2>
          <button className="metamask-popup-close" onClick={onClose}>✕</button>
        </div>

        <div className="metamask-popup-content">
          {isMobile ? (
            <div className="metamask-compact-info">
              <p className="main-message">
                📱 <strong>MetaMask Mobile Required</strong><br/>
                Use MetaMask app's built-in browser to access <strong>bits-ai.io</strong>
              </p>
              
              <div className="quick-steps">
                <span className="step-mini">1️⃣ Open MetaMask app</span>
                <span className="step-mini">2️⃣ Use browser feature</span>
                <span className="step-mini">3️⃣ Go to bits-ai.io</span>
                <span className="step-mini">4️⃣ Connect wallet</span>
              </div>
              
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="metamask-download-link compact">
                📱 Download MetaMask Mobile
              </a>
            </div>
          ) : (
            <div className="metamask-compact-info">
              <p className="main-message">
                🦊 <strong>MetaMask Extension Required</strong><br/>
                Install MetaMask browser extension to connect your wallet
              </p>
              
              <div className="quick-steps">
                <span className="step-mini">1️⃣ Install extension</span>
                <span className="step-mini">2️⃣ Create wallet</span>
                <span className="step-mini">3️⃣ Connect to site</span>
              </div>
              
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="metamask-download-link compact">
                🦊 Install MetaMask Extension
              </a>
            </div>
          )}

          <div className="metamask-note compact">
            <p><strong>⚠️ Security:</strong> Never share private keys • Only use official bits-ai.io</p>
          </div>
        </div>

        <div className="metamask-popup-footer">
          <button className="metamask-popup-button secondary" onClick={onClose}>Cancel</button>
          <button className="metamask-popup-button primary" onClick={onContinue}>I Understand, Continue</button>
        </div>
      </div>
    </div>
  );
};

export default MetaMaskInfoPopup; 