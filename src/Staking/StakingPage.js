import React, { useContext } from "react";
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
  
  // Get pre-filled amount and source from URL
  const prefilledAmount = searchParams.get('amount');
  const rewardsSource = searchParams.get('source') === 'rewards';

  return (
    <div className="staking-layout">
      <main className="staking-main">
        {/* Rewards Claimed Successfully Banner */}
        {rewardsSource && (
          <div style={{
            background: "rgba(0, 255, 195, 0.1)",
            border: "1px solid rgba(0, 255, 195, 0.3)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            🎉 <strong>Rewards Claimed Successfully!</strong> Amount pre-filled below for staking.
          </div>
        )}
        
        <div className="staking-top-row">
          <div className="left-side">
            <StakingSummary signer={signer} />
            <StakingInfoBox />
          </div>
          <div className="right-side">
            <StakeForm 
              signer={signer} 
              prefilledAmount={prefilledAmount}
              rewardsSource={rewardsSource}
            />
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
