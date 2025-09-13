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

const StakingSummary = ({ signer, stakes: stakesFromPage }) => {
  const { walletAddress } = useContext(WalletContext);

  const [totalStaked, setTotalStaked] = useState("0");
  const [totalRewards, setTotalRewards] = useState("0");
  const [activeStakes, setActiveStakes] = useState(0);

  useEffect(() => {
    const fetchSummary = async () => {
      console.log("🔍 signer:", signer);
      console.log("🔍 walletAddress:", walletAddress);

      if (!walletAddress) {
        console.warn("🚫 Wallet not connected or signer missing.");
        return;
      }

      try {
        // If avem stakes din pagină, evităm on-chain reads și calculăm direct
        if (Array.isArray(stakesFromPage) && stakesFromPage.length) {
          console.log("🟢 SUMMARY: using stakes from page (no RPC)");
          const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
          const now = Math.floor(Date.now() / 1000);

          let totalStakedBits = 0;
          let dynRewards = 0;
          let active = 0;
          stakesFromPage.forEach((s, idx) => {
            if (s.withdrawn) return;
            active++;
            const rawAmount = s.locked ?? s.amount ?? 0;
            const staked = parseFloat(require('ethers').utils.formatUnits(rawAmount, 18)) || 0;
            totalStakedBits += staked;

            const start = s.startTime?.toNumber ? s.startTime.toNumber() : Number(s.startTime || 0);
            const lock = s.lockPeriod?.toNumber ? s.lockPeriod.toNumber() : Number(s.lockPeriod || SECONDS_IN_YEAR);
            const elapsed = Math.max(0, now - start);
            const secs = Math.min(elapsed, lock);
            const aprPercent = Number(s.apr) / 100; // 2200 -> 22.0
            const aprDecimal = aprPercent / 100;     // 22.0% -> 0.22
            const perSecond = aprDecimal / SECONDS_IN_YEAR;
            const partial = staked * perSecond * secs;
            dynRewards += partial;
            console.log("🧮 SUMMARY (page) stake["+idx+"] partial:", { staked, secs, aprPercent, partial });
          });

          setTotalStaked(String(totalStakedBits));
          setTotalRewards(String(dynRewards));
          setActiveStakes(active);
          return;
        }

        // Prefer robust read-only provider to avoid MetaMask JSON-RPC issues in Firefox
        const contract = await getStakingContract(null, true);
        console.log("📜 Contract address:", contract.address);

        // Prefer per-user metrics over global totals
        const [total, rewards, stakes] = await Promise.all([
          (async () => {
            try {
              const v = await contract.getUserTotalStaked(walletAddress);
              console.log("📊 User total staked (raw):", v.toString());
              return v;
            } catch (e) {
              console.warn("⚠️ getUserTotalStaked failed, fallback to sum stakes:", e?.message);
              try {
                const arr = await contract.getStakeByUser(walletAddress);
                const { BigNumber } = require('ethers');
                const sum = arr.reduce((acc, s) => (!s.withdrawn ? acc.add(s.locked) : acc), BigNumber.from(0));
                return sum;
              } catch (e2) {
                console.warn("⚠️ getStakeByUser sum fallback failed:", e2?.message);
                const { BigNumber } = require('ethers');
                return BigNumber.from(0);
              }
            }
          })(),
          (async () => {
            try {
              const v = await contract.getTotalCurrentEarnings(walletAddress);
              console.log("🏆 User total current earnings (raw):", v.toString());
              return v;
            } catch (e) {
              console.warn("⚠️ getTotalCurrentEarnings failed, fallback to getTotalRewardForUser:", e?.message);
              try {
                const v2 = await contract.getTotalRewardForUser(walletAddress);
                console.log("🏆 User total reward fallback (raw):", v2.toString());
                return v2;
              } catch (e2) {
                console.warn("⚠️ getTotalRewardForUser failed:", e2?.message);
                const { BigNumber } = require('ethers');
                return BigNumber.from(0);
              }
            }
          })(),
          (async () => {
            if (Array.isArray(stakesFromPage) && stakesFromPage.length) {
              console.log("🌀 Stakes from page hook (preferred):", stakesFromPage);
              return stakesFromPage;
            }
            const s = await contract.getStakeByUser(walletAddress);
            console.log("🌀 Stakes from contract:", s);
            return s;
          })()
        ]);

        const active = stakes.filter(s => !s.withdrawn).length;
        console.log("🧮 Active stakes count:", active);

        console.log("🧩 SUMMARY DEBUG: raw totalStaked BN:", total?.toString?.());
        setTotalStaked(formatUnits(total, 18));

        console.log("🧩 SUMMARY DEBUG: raw totalRewards BN:", rewards?.toString?.());
        console.log("🧩 SUMMARY DEBUG: stakes length:", Array.isArray(stakes) ? stakes.length : 'n/a');

        // Prefer on-chain totals; if zero/unavailable, compute dynamic per-second earnings as UI fallback
        let rewardsReadable = parseFloat(formatUnits(rewards, 18));
        if (!Number.isFinite(rewardsReadable) || rewardsReadable === 0) {
          try {
            const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
            const now = Math.floor(Date.now() / 1000);
            let dyn = 0;
            stakes.forEach((s, idx) => {
              if (s.withdrawn) return;
              // support both TokenStaking (locked) and StakingWithNFTPreOrder (amount)
              const rawAmount = s.locked ?? s.amount ?? 0;
              const staked = parseFloat(formatUnits(rawAmount, 18)) || 0;
              const start = s.startTime?.toNumber ? s.startTime.toNumber() : Number(s.startTime || 0);
              const lock = s.lockPeriod?.toNumber ? s.lockPeriod.toNumber() : Number(s.lockPeriod || SECONDS_IN_YEAR);
              const elapsed = Math.max(0, now - start);
              const secs = Math.min(elapsed, lock); // cap to lock period
              const aprPercent = Number(s.apr) / 100; // e.g., 2200 -> 22.0
              const aprDecimal = aprPercent / 100;    // 22.0% -> 0.22
              const perSecond = aprDecimal / SECONDS_IN_YEAR;
              dyn += staked * perSecond * secs;
              console.log("🧩 SUMMARY DEBUG: stake["+idx+"]", {
                withdrawn: s.withdrawn,
                rawAmount: rawAmount?.toString?.() || String(rawAmount),
                staked,
                start,
                lock,
                elapsed,
                secs,
                aprRaw: Number(s.apr),
                aprPercent,
                aprDecimal,
                perSecond,
                partialDyn: staked * perSecond * secs,
              });
            });
            console.log("🧩 SUMMARY DEBUG: computed dyn rewards:", dyn);
            rewardsReadable = dyn;
          } catch (_) { /* ignore */ }
        }
        console.log("🧩 SUMMARY DEBUG: final rewardsReadable:", rewardsReadable);
        setTotalRewards(String(rewardsReadable));
        setActiveStakes(active);

      } catch (err) {
        console.error("❌ Error fetching staking summary:", err);
      }
    };

    fetchSummary();
  }, [signer, walletAddress, stakesFromPage]);

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
          <div className="ai-stat-value ai-number">
            {(() => {
              const val = parseFloat(totalRewards || '0');
              if (!isFinite(val) || val === 0) return '0.00';
              // Show more precision for small values instead of "< 0.01"
              const decimals = val < 1 ? 4 : 2;
              return val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
            })()}
          </div>
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
