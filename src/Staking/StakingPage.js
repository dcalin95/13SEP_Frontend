import React, { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import WalletContext from "../context/WalletContext";

import { useStakingData } from "./useStakingData";
import StakingSummary from "./components/StakingSummary";
import StakingInfoBox from "./components/StakingInfoBox";
import StakeForm from "./components/StakeForm";
import StakingBox from "./components/StakingBox";
import ClaimStakes from "./components/ClaimStakes";
import StakingUSDValue from "./components/StakingUSDValue";

import "./StakingPage.css";

const StakingPage = () => {
  const { signer, walletAddress } = useContext(WalletContext);
  const { stakes } = useStakingData(signer, walletAddress);
  const [searchParams] = useSearchParams();
  const [prefilledAmount, setPrefilledAmount] = useState(null);
  const [rewardsSource, setRewardsSource] = useState(null);

  // Debug stakes
  useEffect(() => {
    console.log("🔍 StakingPage Debug:");
    console.log("- signer:", !!signer);
    console.log("- walletAddress:", walletAddress);
    console.log("- stakes from useStakingData:", stakes);
    console.log("- stakes.length:", stakes?.length);
  }, [signer, walletAddress, stakes]);

  // Check for URL parameters from rewards hub
  useEffect(() => {
    const amount = searchParams.get('amount');
    const source = searchParams.get('source');
    
    if (amount && parseFloat(amount) > 0) {
      setPrefilledAmount(parseFloat(amount));
    }
    
    if (source === 'rewards') {
      setRewardsSource(true);
    }
  }, [searchParams]);

  return (
    <div className="staking-layout">
      <main className="staking-main">
        {/* Header */}
        <div className="ai-staking-header">
          <h1 className="ai-staking-title">Staking Hub</h1>
          <p className="ai-staking-subtitle">Secure and Efficient Token Staking</p>
        </div>

        {/* 🎁 Rewards Source Banner */}
        {rewardsSource && prefilledAmount && (
          <div className="ai-container" style={{
            background: "linear-gradient(90deg, rgba(0, 255, 195, 0.2), rgba(0, 170, 255, 0.2))",
            border: "1px solid rgba(0, 255, 195, 0.5)",
            borderRadius: "20px",
            padding: "20px",
            marginBottom: "30px",
            textAlign: "center",
            backdropFilter: "blur(20px)"
          }}>
            <h3 style={{ margin: "0 0 10px 0", color: "rgba(255, 255, 255, 0.9)", fontSize: "1.2rem" }}>
              🎉 Rewards Integration Successful!
            </h3>
            <p style={{ margin: "0", opacity: 0.8, fontSize: "1rem" }}>
              Ready to stake {prefilledAmount.toFixed(4)} $BITS from your rewards!
            </p>
          </div>
        )}
        
        <div className="staking-top-row">
          <div className="left-side">
            <div className="ai-container">
              <StakingSummary signer={signer} stakes={stakes} />
            </div>
            <div className="ai-container">
              <StakingInfoBox stakes={stakes} />
            </div>
            <div className="ai-container">
              <StakingUSDValue signer={signer} />
            </div>
          </div>
          <div className="right-side">
            <div className="ai-container">
              <StakeForm signer={signer} prefilledAmount={prefilledAmount} rewardsSource={rewardsSource} />
            </div>
            <div className="ai-container">
              <ClaimStakes signer={signer} />
            </div>
          </div>
        </div>
        <div className="staking-bottom">
          <StakingBox stakes={stakes} signer={signer} />
        </div>
      </main>
    </div>
  );
};

export default StakingPage;
