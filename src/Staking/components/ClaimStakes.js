import React, { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { toast } from "react-toastify";
import WalletContext from "../../context/WalletContext";
import { getStakingContract } from "../../contract/getStakingContract";
import "../styles/ClaimStakes.css";

const formatTimeLeft = (seconds) => {
  const days = Math.floor(seconds / (60 * 60 * 24));
  const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  return `${days} days, ${hours} hours, ${minutes} minutes`;
};

const ClaimStakes = ({ signer }) => {
  const { walletAddress } = useContext(WalletContext);
  const [stakes, setStakes] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [tgeDate, setTgeDate] = useState(0);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [totalClaimable, setTotalClaimable] = useState("0");

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    if (!signer || !walletAddress) return;
    try {
      const contract = getStakingContract(signer);
      const rawStakes = await contract.getStakeByUser(walletAddress);
      const cd = await contract.cooldown();
      const tge = await contract.tgeDate();

      setCooldown(cd.toNumber());
      setTgeDate(tge.toNumber());
      setStakes(rawStakes);

      // Calculate total claimable reward
      let total = ethers.BigNumber.from("0");
      for (let s of rawStakes) {
        const unlockTime = s.startTime.toNumber() + cd.toNumber();
        if (!s.withdrawn && now >= unlockTime && now >= tge.toNumber()) {
          const reward = s.locked
            .mul(s.apr)
            .mul(now - s.updatedAt)
            .div(365 * 24 * 3600)
            .div(ethers.constants.WeiPerEther);
          total = total.add(reward);
        }
      }
      setTotalClaimable(formatUnits(total, 18));
    } catch (err) {
      console.error("Error fetching stakes:", err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [signer, walletAddress, now]);

  const canWithdraw = (stake) => {
    const unlockTime = stake.startTime.toNumber() + cooldown;
    return !stake.withdrawn && now >= unlockTime && now >= tgeDate;
  };

  const renderCountdown = (stake) => {
    const unlockTime = stake.startTime.toNumber() + cooldown;
    const secondsLeft = Math.max(tgeDate, unlockTime) - now;
    return (
      <p className="countdown">
        ⏳ Available in: {formatTimeLeft(secondsLeft)}
      </p>
    );
  };

  const handleClaim = async (index) => {
    if (!signer) return;
    try {
      setLoadingIndex(index);
      const contract = getStakingContract(signer);
      toast.info("⏳ Claiming reward...");
      const tx = await contract.withdraw(index);
      await tx.wait();
      toast.success("✅ Claimed successfully!");
      await fetchData();
    } catch (err) {
      console.error("Claim error:", err.message);
      toast.error("❌ Error: " + err.message);
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <div className="claim-stakes">
      <h3>📊 My Staked Positions</h3>
      <p><strong>💰 Total Claimable:</strong> {totalClaimable} $BITS</p>
      {stakes.length === 0 && <p>No stakes found.</p>}
      {stakes.map((s, i) => {
        const eligible = canWithdraw(s);
        return (
          <div key={i} className="stake-entry">
            <p><strong>Amount:</strong> {formatUnits(s.locked, 18)} $BITS</p>
            <p><strong>APR:</strong> {(s.apr / 1e16).toFixed(1)}%</p>
            <p><strong>Reward:</strong> {`${formatUnits(
              s.locked
                .mul(s.apr)
                .mul(now - s.updatedAt)
                .div(365 * 24 * 3600)
                .div(ethers.constants.WeiPerEther),
              18
            )} $BITS`}</p>
            <p><strong>Status:</strong> {s.withdrawn ? "✅ Claimed" : "🔒 Locked"}</p>

            {!eligible && renderCountdown(s)}

            {/* Buton vizibil mereu */}
            <button
              className="claim-button"
              onClick={() => handleClaim(i)}
              disabled={!eligible || s.withdrawn || loadingIndex === i}
            >
              {loadingIndex === i
                ? "Processing..."
                : s.withdrawn
                ? "✅ Claimed"
                : "📤 Claim"}
            </button>

            {/* Explicație dacă butonul e dezactivat */}
            {!eligible && !s.withdrawn && (
              <p className="claim-info" style={{ fontSize: "0.85em", color: "#bbb", marginTop: "4px" }}>
                ⏳ You can claim this stake once the cooldown and TGE date have passed.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClaimStakes;
