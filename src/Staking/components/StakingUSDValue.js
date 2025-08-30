import React, { useEffect, useState, useContext } from "react";
import WalletContext from "../../context/WalletContext";
import useBitsPrice from "../../Presale/prices/useBitsPrice";
import { getStakingContract } from "../../contract/getStakingContract";
import { formatUnits } from "ethers/lib/utils";
import "../styles/StakingUSDValue.css";

// AI-style number formatting function
const formatAINumber = (number, decimals = 2, isPrice = false) => {
  if (!number || isNaN(number)) return isPrice ? "$0.0000" : "0.00";
  
  const num = parseFloat(number);
  
  if (isPrice && num < 1) {
    // For prices less than $1, show more decimals
    return `$${num.toFixed(4)}`;
  }
  
  if (num >= 1000000) {
    // Millions: 1,234,567.89 → 1.23M
    return `${isPrice ? '$' : ''}${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    // Thousands: 11,664.00 → 11.66K
    return `${isPrice ? '$' : ''}${(num / 1000).toFixed(2)}K`;
  } else {
    // Regular numbers with comma separators: 119.99 → 119.99
    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return `${isPrice ? '$' : ''}${formatted}`;
  }
};

const StakingUSDValue = ({ signer }) => {
  const { walletAddress } = useContext(WalletContext);
  const { bitsPrice, loading: priceLoading } = useBitsPrice(walletAddress);
  
  const [totalStakedUSD, setTotalStakedUSD] = useState(0);
  const [totalRewardsUSD, setTotalRewardsUSD] = useState(0);
  const [totalValueUSD, setTotalValueUSD] = useState(0);

  useEffect(() => {
    const fetchUSDValues = async () => {
      console.log("🔍 StakingUSDValue Debug Start:");
      console.log("- bitsPrice:", bitsPrice);
      console.log("- signer:", !!signer);
      console.log("- walletAddress:", walletAddress);
      console.log("- priceLoading:", priceLoading);

      if (!bitsPrice || !signer || !walletAddress) {
        console.log("❌ Early return - missing bitsPrice, signer or walletAddress");
        setTotalStakedUSD(0);
        setTotalRewardsUSD(0);
        setTotalValueUSD(0);
        return;
      }

      try {
        const contract = getStakingContract(signer);
        console.log("📜 Contract address:", contract.address);

        // Get total staked and rewards from contract (same as StakingSummary)
        const [totalStakedRaw, totalRewardsRaw] = await Promise.all([
          contract.total().then((v) => {
            console.log("📊 Total staked (raw):", v.toString());
            return v;
          }),
          contract.getTotalRewardForUser(walletAddress).then((v) => {
            console.log("🏆 Total rewards (raw):", v.toString());
            return v;
          })
        ]);

        // Convert to readable format
        const stakedBits = parseFloat(formatUnits(totalStakedRaw, 18));
        const rewardsBits = parseFloat(formatUnits(totalRewardsRaw, 18));

        // Calculate USD values
        const stakedUSD = stakedBits * bitsPrice;
        const rewardsUSD = rewardsBits * bitsPrice;
        const totalUSD = stakedUSD + rewardsUSD;

        setTotalStakedUSD(stakedUSD);
        setTotalRewardsUSD(rewardsUSD);
        setTotalValueUSD(totalUSD);

        console.log("💰 USD Value Calculation Final:");
        console.log("- BITS Price:", bitsPrice);
        console.log("- Staked BITS:", stakedBits);
        console.log("- Rewards BITS:", rewardsBits);
        console.log("- Staked USD:", stakedUSD);
        console.log("- Rewards USD:", rewardsUSD);
        console.log("- Total USD:", totalUSD);

      } catch (err) {
        console.error("❌ Error fetching USD values:", err);
        setTotalStakedUSD(0);
        setTotalRewardsUSD(0);
        setTotalValueUSD(0);
      }
    };

    fetchUSDValues();
  }, [bitsPrice, signer, walletAddress, priceLoading]);

  if (priceLoading) {
    return (
      <div className="staking-usd-container">
        <h3 className="usd-title">USD Value</h3>
        <div className="usd-loading">Loading price...</div>
      </div>
    );
  }

  return (
    <div className="staking-usd-container">
      <h3 className="usd-title">USD Value</h3>
      
      <div className="usd-grid">
        <div className="usd-item">
          <span className="usd-label">$BITS Price</span>
          <span className="usd-value ai-number">
            {formatAINumber(bitsPrice, 4, true)}
          </span>
        </div>
        
        <div className="usd-item">
          <span className="usd-label">Staked Value</span>
          <span className="usd-value ai-number">
            {formatAINumber(totalStakedUSD, 2, true)}
          </span>
        </div>
        
        <div className="usd-item">
          <span className="usd-label">Rewards Value</span>
          <span className="usd-value ai-number">
            {formatAINumber(totalRewardsUSD, 2, true)}
          </span>
        </div>
        
        <div className="usd-item usd-total">
          <span className="usd-label">Total Value</span>
          <span className="usd-value usd-total-value ai-number ai-number-glow">
            {formatAINumber(totalValueUSD, 2, true)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StakingUSDValue;
