import React from "react";
import TokenomicsChart from "./TokenomicsChart";
import "./TokenomicsPage.css";

const TokenomicsPage = () => {
  return (
    <div className="tokenomics-page">
      <div className="tokenomics-page-container">
        <TokenomicsChart />
        
        <div className="tokenomics-info">
          <h2>Tokenomics Overview</h2>
          <p>
            BitSwapDEX AI tokenomics are designed to ensure sustainable growth, 
            community engagement, and long-term value creation for all stakeholders.
          </p>
          
          <div className="tokenomics-details">
            <div className="detail-item">
              <h3>Total Supply</h3>
              <p>3,000,000,000 $BITS</p>
            </div>
            
            <div className="detail-item">
              <h3>Initial Price</h3>
              <p>$0.0001 per $BITS</p>
            </div>
            
            <div className="detail-item">
              <h3>Vesting Period</h3>
              <p>Team & Treasury: 12 months linear vesting</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenomicsPage; 