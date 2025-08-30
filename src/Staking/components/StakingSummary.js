import React, { useEffect, useState, useContext } from "react";
import WalletContext from "../../context/WalletContext";
import { getStakingContract } from "../../contract/getStakingContract";
import { formatUnits } from "ethers/lib/utils";
import "../styles/StakingSummary.css";

// AI-style number formatting function
const formatAINumber = (number, decimals = 2) => {
  if (!number || isNaN(number)) return "0.00";
  
  const num = parseFloat(number);
  
  if (num >= 1000000) {
    // Millions: 1,234,567.89 → 1.23M
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    // Thousands: 11,664.00 → 11.66K
    return `${(num / 1000).toFixed(2)}K`;
  } else {
    // Regular numbers with comma separators
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
};

const StakingSummary = ({ signer }) => {
  const { walletAddress } = useContext(WalletContext);

  const [totalStaked, setTotalStaked] = useState("0");
  const [totalRewards, setTotalRewards] = useState("0");
  const [activeStakes, setActiveStakes] = useState(0);

  useEffect(() => {
    const fetchSummary = async () => {
      console.log("🔍 signer:", signer);
      console.log("🔍 walletAddress:", walletAddress);

      if (!signer || !walletAddress) {
        console.warn("🚫 Wallet not connected or signer missing.");
        return;
      }

      try {
        const contract = getStakingContract(signer);
        console.log("📜 Contract address:", contract.address);

        const [total, rewards, stakes] = await Promise.all([
          contract.total().then((v) => {
            console.log("📊 Total staked (raw):", v.toString());
            return v;
          }),
          contract.getTotalRewardForUser(walletAddress).then((v) => {
            console.log("🏆 Total rewards (raw):", v.toString());
            return v;
          }),
          contract.getStakeByUser(walletAddress).then((s) => {
            console.log("🌀 Stakes array:", s);
            return s;
          })
        ]);

        const active = stakes.filter(s => !s.withdrawn).length;
        console.log("🧮 Active stakes count:", active);

        setTotalStaked(formatUnits(total, 18));
        setTotalRewards(formatUnits(rewards, 18));
        setActiveStakes(active);

      } catch (err) {
        console.error("❌ Error fetching staking summary:", err);
      }
    };

    fetchSummary();
  }, [signer, walletAddress]);

  return (
    <div className="stakingCard">
      <h2 className="ai-summary-title">Analytics</h2>
      
      <div className="ai-stats-grid">
        <div className="ai-stat-item">
          <div className="ai-stat-label">Total Staked</div>
          <div className="ai-stat-value ai-number">{formatAINumber(totalStaked, 2)}</div>
          <div className="ai-stat-label">$BITS</div>
        </div>
        
        <div className="ai-stat-item">
          <div className="ai-stat-label">Total Rewards</div>
          <div className="ai-stat-value ai-number">{formatAINumber(totalRewards, 2)}</div>
          <div className="ai-stat-label">$BITS</div>
        </div>
        
        <div className="ai-stat-item">
          <div className="ai-stat-label">Active Stakes</div>
          <div className="ai-stat-value ai-number">{activeStakes}</div>
          <div className="ai-stat-label">Positions</div>
        </div>
        
        <div className="ai-stat-item">
          <div className="ai-stat-label">Efficiency</div>
          <div className="ai-stat-value">{activeStakes > 0 ? '95%' : '0%'}</div>
          <div className="ai-stat-label">Rate</div>
        </div>
      </div>
    </div>
  );
};

export default StakingSummary;
