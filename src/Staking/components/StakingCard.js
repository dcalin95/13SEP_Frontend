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
  const [hasClaimReward, setHasClaimReward] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

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

  // detect optional claimReward in ABI
  useEffect(() => {
    (async () => {
      try {
        const contract = getStakingContract(signer);
        const iface = (await contract).interface || contract.interface;
        setHasClaimReward(!!iface.functions["claimReward(uint256)"]);
      } catch (_) {
        setHasClaimReward(false);
      }
    })();
  }, [signer]);

  useEffect(() => {
    if (!stake.locked || !stake.apr) return;
    
    console.log("🎯 [REWARD CALC] Starting dynamic reward calculation");
    console.log("- Locked amount:", formatEther(stake.locked));
    console.log("- APR (raw):", stake.apr.toString());
    console.log("- Start time:", stake.startTime.toNumber());

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const secondsPassed = Math.max(0, now - stake.startTime.toNumber());

      // ✅ FIXED: Use correct APR calculation (divide by 100, not 1e18)
      const aprPercentage = Number(stake.apr) / 100; // APR as percentage (20.0 for 20%)
      const aprDecimal = aprPercentage / 100; // Convert to decimal (0.2 for 20%)
      const aprPerSecond = aprDecimal / (365 * 24 * 60 * 60); // APR per second
      
      const stakedAmount = parseFloat(formatEther(stake.locked));
      const currentReward = stakedAmount * aprPerSecond * secondsPassed;
      
      console.log("💰 [REWARD UPDATE]", {
        secondsPassed,
        aprPercentage: aprPercentage + "%",
        aprDecimal,
        aprPerSecond,
        stakedAmount,
        currentReward: currentReward.toFixed(6)
      });
      
      setDynamicReward(currentReward);
    }, 1000); // Update every second (not 30fps)

    return () => clearInterval(interval);
  }, [stake]);

  const handleWithdraw = async () => {
    if (!signer) return;
    setLoading(true);
    setFeedback("");

    try {
      const contract = getStakingContract(signer);
      try {
        // preflight on robust provider to avoid MetaMask JSON-RPC noise
        const ro = await getStakingContract(null, true);
        await ro.callStatic.withdraw(index);
      } catch (e) {
        // Friendly diagnostics
        const perStakeLock = stake.lockPeriod?.toNumber ? stake.lockPeriod.toNumber() : cooldown;
        const unlockTime = stake.startTime.toNumber() + perStakeLock;
        const nowTs = Math.floor(Date.now() / 1000);
        const lockLeft = Math.max(0, unlockTime - nowTs);
        const tgeLeft = Math.max(0, tgeDate - nowTs);
        if (stake.withdrawn) {
          setFeedback("⛔ Already withdrawn.");
        } else if (lockLeft > 0) {
          setFeedback(`⛔ Stake is still locked for ${formatTimeLeft(lockLeft)}.`);
        } else if (tgeLeft > 0) {
          setFeedback(`⛔ TGE not reached. Available in ${formatTimeLeft(tgeLeft)}.`);
        } else {
          // decode Solidity Panic if present
          const data = e?.data || e?.error?.data || '';
          if (typeof data === 'string' && data.startsWith('0x4e487b71')) {
            const code = parseInt(data.slice(-64), 16);
            if (code === 0x32) {
              setFeedback("⛔ Invalid stake index (stake not found). Please refresh your positions.");
            } else {
              setFeedback(`⛔ Contract panic (0x${code.toString(16)}).`);
            }
          } else {
            const reason = e?.error?.message || e?.message || 'Withdraw not available';
            setFeedback(`⛔ ${reason}`);
          }
        }
        setLoading(false);
        return;
      }
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

  const getWithdrawBlockReason = () => {
    if (stake.withdrawn) return "Already withdrawn.";
    const perStakeLock = stake.lockPeriod?.toNumber ? stake.lockPeriod.toNumber() : cooldown;
    const unlockTime = stake.startTime.toNumber() + perStakeLock;
    const nowTs = Math.floor(Date.now() / 1000);
    const lockLeft = Math.max(0, unlockTime - nowTs);
    const tgeLeft = Math.max(0, tgeDate - nowTs);
    if (lockLeft > 0) return `Locked for ${formatTimeLeft(lockLeft)}`;
    if (tgeLeft > 0) return `TGE in ${formatTimeLeft(tgeLeft)}`;
    return "";
  };

  const handleClaimRewardOnly = async () => {
    if (!signer || !hasClaimReward) return;
    setLoading(true);
    setFeedback("");
    try {
      const contract = getStakingContract(signer);
      try {
        await contract.callStatic.claimReward(index);
      } catch (e) {
        const reason = e?.error?.message || e?.data || e?.message || "Claim not available";
        setFeedback(`⛔ ${reason}`);
        setLoading(false);
        return;
      }
      const tx = await contract.claimReward(index);
      setFeedback("⏳ Claiming rewards...");
      await tx.wait();
      setFeedback("✅ Rewards claimed!");
    } catch (err) {
      console.error("❌ ClaimReward Error:", err.message);
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.stakingCard} onMouseEnter={() => setShowSummary(true)} onMouseLeave={() => setShowSummary(false)}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.stakeTitle}>
          <div className={styles.stakeDate}>
            <span className={styles.dateLabel}>Staked on</span>
            <span className={styles.dateValue}>
              {new Date(stake.startTime.toNumber() * 1000).toLocaleDateString('ro-RO', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              })}
            </span>
            <span className={styles.timeValue}>
              {new Date(stake.startTime.toNumber() * 1000).toLocaleTimeString('ro-RO', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className={styles.statusIndicator}>
            {stake.withdrawn ? (
              <span className={styles.statusClaimed}>✅ CLAIMED</span>
            ) : cooldownRemaining > 0 ? (
              <span className={styles.statusLocked}>🔒 LOCKED</span>
            ) : (
              <span className={styles.statusReady}>🚀 READY</span>
            )}
          </div>
        </div>
        
        {/* Main Amount Display */}
        <div className={styles.mainAmount}>
          <span className={styles.amountValue}>{Math.floor(parseFloat(formatEther(stake.locked)))}</span>
          <span className={styles.amountUnit}>$BITS</span>
        </div>
        
        {/* APR Highlight */}
        <div className={styles.aprHighlight}>
          <span className={styles.aprLabel}>EARNING</span>
          <span className={styles.aprValue}>{(Number(stake.apr) / 100).toFixed(1)}%</span>
          <span className={styles.aprUnit}>APR</span>
        </div>
      </div>

      {/* Details Section */}
      <div className={styles.detailsSection}>
        {dynamicReward > 0 && (
          <div className={styles.rewardBox}>
            <span className={styles.rewardLabel}>Pending Rewards</span>
            <span className={styles.rewardValue}>+{dynamicReward.toFixed(4)} $BITS</span>
          </div>
        )}
        
        {cooldownRemaining > 0 && (
          <div className={styles.countdownBox}>
            <span className={styles.countdownLabel}>Unlocks in</span>
            <span className={styles.countdownValue}>{formatTimeLeft(cooldownRemaining)}</span>
          </div>
        )}
      </div>

      {/* Hover Summary Tooltip */}
      {showSummary && (
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 10px', fontSize: 12, lineHeight: 1.3, color: '#fff', zIndex: 5 }}>
          <div>Amount: <strong>{Math.floor(parseFloat(formatEther(stake.locked)) || 0)}</strong> $BITS</div>
          <div>APR: <strong>{(Number(stake.apr) / 100).toFixed(1)}%</strong></div>
          <div>Reward: <strong>{dynamicReward.toFixed(4)}</strong> $BITS</div>
          <div>Status: <strong>{canWithdraw ? 'Ready' : 'Locked'}</strong></div>
          {!canWithdraw && (
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Reason: {getWithdrawBlockReason()}</div>
          )}
        </div>
      )}

      {/* Action Section */}
      <div className={styles.actionSection}>
        <button
          className={styles.claimButton}
          onClick={handleWithdraw}
          disabled={!canWithdraw || stake.withdrawn || loading}
        >
          {loading
            ? "⏳ Processing..."
            : stake.withdrawn
            ? "✅ Withdrawn"
            : canWithdraw
            ? `⬇️ Withdraw ${Math.floor(parseFloat(formatEther(stake.locked)))} $BITS`
            : "⬇️ Withdraw"}
        </button>

        {hasClaimReward && !stake.withdrawn && (
          <button
            className={styles.claimButton}
            onClick={handleClaimRewardOnly}
            disabled={loading}
            style={{ background: 'transparent', borderColor: '#4ecdc4' }}
          >
            {loading ? "⏳ Processing..." : "💰 Claim Rewards"}
          </button>
        )}
      </div>

      {feedback && <div className={styles.feedbackSection}>{feedback}</div>}
    </div>
  );
};

export default StakingCard;
