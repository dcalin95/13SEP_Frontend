import React, { useState, useEffect } from 'react';
import './FloatingMenu.css';

const FloatingMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [cryptoOpen, setCryptoOpen] = useState(false);

  // Conectare cu dashboard-urile existente
  useEffect(() => {
    const handleMarketingOpen = () => setMarketingOpen(true);
    const handleCryptoOpen = () => setCryptoOpen(true);
    
    window.addEventListener('openAIMarketing', handleMarketingOpen);
    window.addEventListener('openAICrypto', handleCryptoOpen);
    
    return () => {
      window.removeEventListener('openAIMarketing', handleMarketingOpen);
      window.removeEventListener('openAICrypto', handleCryptoOpen);
    };
  }, []);

  const menuItems = [
    { 
      id: 'marketing', 
      label: 'AI Marketing', 
      icon: '📈', 
      action: () => {
        // Trigger marketing dashboard prin custom event către MarketingDashboard
        const event = new CustomEvent('toggleMarketingDashboard');
        window.dispatchEvent(event);
      }
    },
    { 
      id: 'crypto', 
      label: 'AI Crypto', 
      icon: '₿', 
      action: () => {
        // Trigger crypto dashboard prin custom event către CryptoAnalyticsDashboard
        const event = new CustomEvent('toggleCryptoDashboard');
        window.dispatchEvent(event);
      }
    },
    { id: 'portfolio', label: 'AI Portfolio', icon: '🧠', action: () => window.location.href = '/ai-portfolio' },
    { id: 'accessibility', label: 'Accessibility', icon: '♿', action: () => window.dispatchEvent(new CustomEvent('toggleAccessibility')) }
  ];

  return (
    <div className="floating-menu">
      {/* Menu Items */}
      {isOpen && (
        <div className="menu-items">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              className="menu-item"
              onClick={() => { item.action(); setIsOpen(false); }}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Hamburger Button */}
      <button 
        className={`hamburger-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  );
};

export default FloatingMenu;
