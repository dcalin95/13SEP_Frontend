import React, { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import WalletContext from "../context/WalletContext";

import { useStakingData } from "./useStakingData";
import StakingSummary from "./components/StakingSummary";
import StakingInfoBox from "./components/StakingInfoBox";
import StakeForm from "./components/StakeForm";
import StakingBox from "./components/StakingBox";
import ClaimStakes from "./components/ClaimStakes";

import "./StakingPage.css";

const StakingPage = () => {
  const { signer, address } = useContext(WalletContext);
  const { stakes } = useStakingData(signer, address);
  const [searchParams] = useSearchParams();
  const [prefilledAmount, setPrefilledAmount] = useState(null);
  const [rewardsSource, setRewardsSource] = useState(null);

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
        {/* 🎁 Rewards Source Banner */}
        {rewardsSource && prefilledAmount && (
          <div style={{
            background: "linear-gradient(90deg, rgba(0, 255, 195, 0.1), rgba(0, 170, 255, 0.1))",
            border: "1px solid rgba(0, 255, 195, 0.3)",
            borderRadius: "12px",
            padding: "15px",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            <h3 style={{ margin: "0 0 5px 0", color: "#00ffc3" }}>
              🎉 Rewards Claimed Successfully!
            </h3>
            <p style={{ margin: "0", opacity: 0.9 }}>
              Ready to stake {prefilledAmount.toFixed(4)} $BITS from your rewards. Higher yield awaits!
            </p>
          </div>
        )}
        
        <div className="staking-top-row">
          <div className="left-side">
            <StakingSummary signer={signer} />
            <StakingInfoBox />
          </div>
          <div className="right-side">
            <StakeForm signer={signer} prefilledAmount={prefilledAmount} rewardsSource={rewardsSource} />
            <ClaimStakes signer={signer} /> {/* 🔥 Mutat aici */}
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
