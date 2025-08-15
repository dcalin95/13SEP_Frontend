import React, { useEffect, useState, useContext } from "react";
import "../styles/StakingInfoBox.css";
import { getStakingContract } from "../../contract/getStakingContract";
import WalletContext from "../../context/WalletContext";
import { formatUnits } from "ethers/lib/utils";

const formatTime = (sec) => {
  const days = Math.floor(sec / (60 * 60 * 24));
  const hours = Math.floor((sec % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((sec % (60 * 60)) / 60);
  const seconds = sec % 60;
  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
};

const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString();
};

const StakingInfoBox = () => {
  const { signer } = useContext(WalletContext);
  const [cooldownStatic, setCooldownStatic] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(null);
  const [unstakeFee, setUnstakeFee] = useState(null);
  const [tgeDate, setTgeDate] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchContractData = async () => {
    if (!signer) {
      console.warn("⚠️ Signer not available – wallet might not be connected.");
      return;
    }

    try {
      setLoading(true);

      const network = await signer.provider.getNetwork();
      console.log("🌐 Connected network:", network.name, "(chainId:", network.chainId, ")");

      const contract = getStakingContract(signer);
      console.log("📜 Staking contract address:", contract.address);

      const cd = await contract.cooldown();
      const fee = await contract.unstakeFee();
      const tge = await contract.tgeDate();

      console.log("⏳ Cooldown (seconds):", cd.toString());
      console.log("💰 Unstake Fee (1e18):", fee.toString());
      console.log("📅 TGE Date (timestamp):", tge.toString());

      setCooldownStatic(cd.toNumber());
      setCooldownRemaining(cd.toNumber());
      setUnstakeFee(Number(formatUnits(fee, 16)));
      setTgeDate(tge.toNumber());
    } catch (err) {
      console.error("❌ Error fetching contract data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractData();
  }, [signer]);

  useEffect(() => {
    if (cooldownRemaining === null) return;

    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  return (
    <div className="staking-info-box-container">
      <ul className="staking-info-box">
        <li>✅ Stake your $BITS to earn continuous rewards.</li>
        <li>⏳ Cooldown: {cooldownRemaining !== null ? formatTime(cooldownRemaining) : "..."}</li>
        <li>💰 Unstake Fee: {unstakeFee !== null ? `${unstakeFee.toFixed(2)}%` : "..."}</li>
        <li>📅 TGE Date: {tgeDate !== null ? formatDate(tgeDate) : "..."}</li>
        <li>🔒 100% non-custodial. Your funds, your control.</li>
      </ul>
      <button className="refresh-button" onClick={fetchContractData} disabled={loading}>
        {loading ? "Updating..." : "🔄 Refresh"}
      </button>
    </div>
  );
};

export default StakingInfoBox;
