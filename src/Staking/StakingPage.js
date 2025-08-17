import React, { useContext } from "react";
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

  return (
    <div className="staking-layout">
      <main className="staking-main">
        <div className="staking-top-row">
          <div className="left-side">
            <StakingSummary signer={signer} />
            <StakingInfoBox />
          </div>
          <div className="right-side">
            <StakeForm signer={signer} />
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
