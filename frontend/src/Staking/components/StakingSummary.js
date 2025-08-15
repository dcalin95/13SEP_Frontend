import React, { useEffect, useState, useContext } from "react";
import WalletContext from "../../context/WalletContext";
import { getStakingContract } from "../../contract/getStakingContract";
import { formatUnits } from "ethers/lib/utils";
import "../styles/StakingSummary.css";

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
    <div className="staking-summary">
      <p>🔹 <span className="label">Total Staked:</span>{" "}
        <span className="value">{parseFloat(totalStaked).toFixed(2)}</span>{" "}
        <span className="unit">$BITS</span>
      </p>
      <p>🏆 <span className="label">Total Rewards:</span>{" "}
        <span className="value">{parseFloat(totalRewards).toFixed(2)}</span>{" "}
        <span className="unit">$BITS</span>
      </p>
      <p>🌀 <span className="label">Active Stakes:</span>{" "}
        <span className="value">{activeStakes}</span>
      </p>
    </div>
  );
};

export default StakingSummary;
