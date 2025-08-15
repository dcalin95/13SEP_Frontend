import React, { useState, useEffect } from "react";
import { formatEther } from "ethers/lib/utils";
import { getStakingContract } from "../../contract/getStakingContract";
import styles from '../styles/StakingCard.module.css';
console.log("✅ StakingCard loaded");


const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

const formatTimeLeft = (secondsLeft) => {
  const days = Math.floor(secondsLeft / (3600 * 24));
  const hours = Math.floor((secondsLeft % (3600 * 24)) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  return `${days} days, ${hours} hours, ${minutes} minutes`;
};

const StakingCard = ({ stake, index, signer, tgeDate, cooldown }) => {
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [dynamicReward, setDynamicReward] = useState(0);

  const circleLength = 2 * Math.PI * 50;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const stakeCooldownEnd = stake.startTime.toNumber() + cooldown;
      const timeLeft = Math.max(0, stakeCooldownEnd - now);
      setCooldownRemaining(timeLeft);

      const passedCooldown = now > stakeCooldownEnd;
      const passedTGE = now > tgeDate;
      const eligible = passedCooldown && passedTGE && !stake.withdrawn;
      setCanWithdraw(eligible);
    }, 1000);

    return () => clearInterval(interval);
  }, [stake, cooldown, tgeDate]);

  useEffect(() => {
    if (!stake.locked || !stake.apr) return;
    let lastValue = 0;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const secondsPassed = now - stake.startTime.toNumber();

      const aprPerSecond = Number(stake.apr) / 1e18 / (365 * 24 * 60 * 60);
      const targetReward = parseFloat(formatEther(stake.locked)) * aprPerSecond * secondsPassed;

      lastValue += (targetReward - lastValue) * 0.05;
      setDynamicReward(lastValue);
    }, 1000 / 30);

    return () => clearInterval(interval);
  }, [stake]);

  const handleWithdraw = async () => {
    if (!signer) return;
    setLoading(true);
    setFeedback("");

    try {
      const contract = getStakingContract(signer);
      const tx = await contract.withdraw(index);
      setFeedback("⏳ Transaction pending...");
      await tx.wait();
      setFeedback("🎉 Stake successfully withdrawn!");
    } catch (err) {
      console.error("❌ Withdraw Error:", err.message);
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.stakingCard}>
      <h3>Staking #{index + 1}</h3>
      <div className={styles.cooldownProgress}>
        <svg width="120" height="120">
          <defs>
            <linearGradient id="cooldownGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ffff" />
              <stop offset="100%" stopColor="#ff00ff" />
            </linearGradient>
            <filter id="glow">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00ffff" />
            </filter>
          </defs>
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="url(#cooldownGradient)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circleLength}
            strokeDashoffset={(cooldownRemaining / cooldown) * circleLength}
            style={{
              transition: "stroke-dashoffset 1s linear",
              filter: cooldownRemaining < 86400 ? "url(#glow)" : "none" // glow under 24h
            }}
          />
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
            {cooldownRemaining > 0 ? formatTimeLeft(cooldownRemaining) : "✅ Done"}
          </text>
        </svg>
      </div>

      <div className={styles.stakingDetails}>
        <p><strong>Locked:</strong> {formatEther(stake.locked)} $BITS</p>
        <p><strong>APR:</strong> {(Number(stake.apr) / 1e16).toFixed(2)}%</p>
        <p><strong>Estimated Reward:</strong> {dynamicReward.toFixed(6)} $BITS</p>
        <p><strong>Start:</strong> {formatDate(stake.startTime.toNumber())}</p>
        <p><strong>Cooldown Remaining:</strong> {cooldownRemaining > 0 ? formatTimeLeft(cooldownRemaining) : "✅ Cooldown finished"}</p>
        <p><strong>Status:</strong> {stake.withdrawn ? "✅ Withdrawn" : "⏳ Active"}</p>

        {canWithdraw && (
          <button className={styles.claimButton} onClick={handleWithdraw} disabled={loading}>
            {loading ? "Processing..." : "Claim & Unstake"}
          </button>
        )}

        {feedback && <p className={styles.feedback}>{feedback}</p>}
      </div>
    </div>
  );
};

export default StakingCard;
