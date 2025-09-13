import React, { useContext, useEffect, useState } from "react";
import { useBoosterSummary } from "./useBoosterSummary";
import WalletContext from "../../context/WalletContext";
import { ethers } from "ethers";
import "./BITSAnalytics.css";
// AdditionalBonusBox nu mai e necesar - widget-ul e integrat direct
import DashboardHeader from "./components/DashboardHeader";
import { useStakingData } from "../../Staking/useStakingData";
import { getStakingContract, executeStakingCall } from "../../contract/getStakingContract";
import solanaLogo from "../../assets/icons/solana-logo.png";
import telegramLogo from "../../assets/TLogo.png";
import {
  formatUSD,
  formatBITS,
  formatPrice,
  formatROI,
  formatTransactions,
  shortenAddress,
} from "./utils/dataFormatters";

const BITSAnalytics = () => {
  const walletContextValue = useContext(WalletContext);
  const { walletAddress } = walletContextValue || {};
  const { loading, data } = useBoosterSummary();
  const { stakes: stakingStakes, totalReward: stakingTotalRewardBN } = useStakingData(walletContextValue?.signer, walletAddress);
  console.log("🔎 [STAKING DEBUG] useStakingData:", {
    stakesLen: Array.isArray(stakingStakes) ? stakingStakes.length : 'n/a',
    firstStake: Array.isArray(stakingStakes) && stakingStakes[0] ? {
      locked: stakingStakes[0]?.locked?.toString?.(),
      apr: stakingStakes[0]?.apr?.toString?.(),
      startTime: stakingStakes[0]?.startTime?.toString?.(),
      withdrawn: stakingStakes[0]?.withdrawn
    } : null,
    totalRewardBN: stakingTotalRewardBN?._isBigNumber ? stakingTotalRewardBN.toString() : stakingTotalRewardBN
  });
  const stakingPendingFromStakingPage = (() => {
    try {
      // Prefer totalReward; fallback to summing stake.reward
      if (stakingTotalRewardBN && stakingTotalRewardBN._isBigNumber) {
        return parseFloat(ethers.utils.formatUnits(stakingTotalRewardBN, 18));
      }
      if (Array.isArray(stakingStakes) && stakingStakes.length) {
        const { BigNumber } = ethers;
        const total = stakingStakes.reduce((acc, s) => {
          try { return acc.add(s?.reward || BigNumber.from(0)); } catch { return acc; }
        }, BigNumber.from(0));
        return parseFloat(ethers.utils.formatUnits(total, 18));
      }
      return 0;
    } catch { return 0; }
  })();
  console.log("🔎 [STAKING DEBUG] from useStakingData -> pending:", stakingPendingFromStakingPage);

  // Local live fallback (direct on-chain reads) – sums current earnings per stake
  const [stakingProfitLive, setStakingProfitLive] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!walletAddress) return;
        let total = 0;
        // Robust wrapper with multi-RPC fallback
        try {
          const raw = await executeStakingCall(async (contract) => contract.getTotalCurrentEarnings(walletAddress));
          total = parseFloat(ethers.utils.formatUnits(raw || 0, 18));
          console.log("🔎 [STAKING DEBUG] getTotalCurrentEarnings:", raw?.toString?.(), "→", total);
        } catch {
          try {
            const stakes = await executeStakingCall(async (contract) => contract.getStakeByUser(walletAddress));
            const infos = await Promise.all(
              stakes.map((_, i) => executeStakingCall((contract) => contract.getStakeCompleteInfo(walletAddress, i)).catch(() => null))
            );
            total = infos.filter(Boolean).reduce((s, info) => {
              const currentRaw = info?.[2] ?? info?.currentEarnings;
              try { return s + parseFloat(ethers.utils.formatUnits(currentRaw || 0, 18)); } catch { return s; }
            }, 0);
            console.log("🔎 [STAKING DEBUG] sum(getStakeCompleteInfo.currentEarnings) =", total);
          } catch {}
        }
        if (!cancelled) setStakingProfitLive(total || 0);
      } catch {}
    };
    run();
    const t = setInterval(run, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, [walletAddress]);

  // UI-level dynamic replica of staking page calculation (per-second, float math)
  const [stakingProfitPerSecondCalc, setStakingProfitPerSecondCalc] = useState(0);
  useEffect(() => {
    if (!Array.isArray(stakingStakes) || stakingStakes.length === 0) {
      setStakingProfitPerSecondCalc(0);
      return;
    }
    const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      let total = 0;
      try {
        for (const s of stakingStakes) {
          if (!s || s.withdrawn) continue;
          const secondsPassed = Math.max(0, now - (s.startTime?.toNumber?.() ?? 0));
          const aprPercentage = Number(s.apr) / 100;   // e.g., 2200 -> 22.0
          const aprDecimal = aprPercentage / 100;      // 22.0% -> 0.22
          const aprPerSecond = aprDecimal / SECONDS_IN_YEAR;
          const stakedAmount = parseFloat(ethers.utils.formatEther(s.locked || 0));
          total += stakedAmount * aprPerSecond * secondsPassed;
        }
      } catch {}
      setStakingProfitPerSecondCalc(total || 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [stakingStakes]);
  console.log("🔎 [STAKING DEBUG] live totals:", {
    fromHook: stakingPendingFromStakingPage,
    fromOnChain: stakingProfitLive,
    fromPerSecondCalc: stakingProfitPerSecondCalc,
    fromSafeData: data?.stakingProfit,
    breakdown: Array.isArray(data?.stakingBreakdown) ? data.stakingBreakdown.map(b => b?.pending) : null
  });
  
  // SAFE DATA FIRST - pentru a evita hoisting errors
  const safeData = data || {
    totalBits: 0,
    currentPrice: 0,
    roiPercent: 0,
    realInvestedUSD: 0,
    referralBonus: 0,
    telegramBonus: 0,
    bonusCalculatedLocally: 0,
    txCount: 0,
    hasError: false,
    investedUSDOnSolana: 0,
  };

  // Debug: Log what we get from WalletContext and data
  console.log("🔍 [BITSAnalytics] WalletContext value:", walletContextValue);
  console.log("🔍 [BITSAnalytics] Wallet address from context:", walletAddress);
  console.log("🔍 [BITSAnalytics] Provider from context:", !!walletContextValue?.provider);
  console.log("🔍 [BITSAnalytics] Signer from context:", !!walletContextValue?.signer);
  console.log("🔍 [BITSAnalytics] Loading state:", loading);
  console.log("🔍 [BITSAnalytics] Raw data from useBoosterSummary:", data);
  console.log("🔍 [BITSAnalytics] realInvestedUSD from data:", data?.realInvestedUSD);
  
  // 🚨 DEBUGGING BITS HOLDINGS ISSUE
  console.log("🚨 [BITS HOLDINGS DEBUG] ==================");
  console.log("🚨 [BITS HOLDINGS] totalBits from data:", data?.totalBits);
  console.log("🚨 [BITS HOLDINGS] totalBits type:", typeof data?.totalBits);
  console.log("🚨 [BITS HOLDINGS] totalBits > 0:", data?.totalBits > 0);
  console.log("🚨 [BITS HOLDINGS] safeData.totalBits:", safeData.totalBits);
  console.log("🚨 [BITS HOLDINGS] safeData.totalBits > 0:", safeData.totalBits > 0);
  console.log("🚨 [BITS HOLDINGS] formatBITS(safeData.totalBits):", formatBITS(safeData.totalBits));
  console.log("🚨 [BITS HOLDINGS DEBUG] ==================");

  // 🎯 SPECTACULAR WIDGET EXPANSION EFFECT - MANUAL CONTROL
  useEffect(() => {
    const handleWidgetClick = (event) => {
      const widget = event.currentTarget;
      
      // Toggle between expanded and normal state
      if (widget.classList.contains('expanding')) {
        // If already expanded, start the return animation
        widget.classList.remove('expanding');
        widget.classList.add('returning');
        
        // Remove returning class after animation completes
        setTimeout(() => {
          widget.classList.remove('returning');
        }, 600);
      } else {
        // If not expanded, expand it and keep it expanded
        widget.classList.add('expanding');
      }
    };

    // Add click listeners to all widgets
    const widgets = document.querySelectorAll('.widget');
    widgets.forEach(widget => {
      widget.addEventListener('click', handleWidgetClick);
    });

    // Cleanup function
    return () => {
      widgets.forEach(widget => {
        widget.removeEventListener('click', handleWidgetClick);
      });
    };
  }, [data]); // Re-run when data changes (when widgets re-render)

  // Check if WalletContext is properly provided
  if (!walletContextValue) {
    console.error("❌ [BITSAnalytics] WalletContext is null/undefined - WalletProvider not found!");
    return (
      <div className="error-text">
        ⚠️ Wallet context not available. Please ensure WalletProvider is wrapping this component.
        <br />
        <small>Files needed: WalletContext.js, HeaderWalletInfo.js, etc.</small>
      </div>
    );
  }
  
  // Additional check for critical context values
  if (!walletContextValue.provider && walletAddress) {
    console.error("❌ [BITSAnalytics] Wallet connected but NO PROVIDER in context!");
    console.log("🚨 [BITSAnalytics] This means WalletContext is not working properly");
  }
  
  if (!walletContextValue.signer && walletAddress) {
    console.error("❌ [BITSAnalytics] Wallet connected but NO SIGNER in context!");
    console.log("🚨 [BITSAnalytics] This means WalletContext is not working properly");
  }

  // Ensure numeric types before calculations (support BigNumber/string)
  const toNumber = (value, decimals = 18) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.\-eE]/g, '');
      const parsed = parseFloat(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value && value._isBigNumber) {
      try { return parseFloat(ethers.utils.formatUnits(value, decimals)); } catch { return 0; }
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const numericTotalBits = toNumber(safeData.totalBits, 18);
  const numericReferralBonus = toNumber(safeData.referralBonus, 18);
  const numericTelegramBonus = toNumber(safeData.telegramBonus, 18);
  const numericLocalBonus = toNumber(safeData.bonusCalculatedLocally, 18);
  const numericPrice = toNumber(safeData.currentPrice, 18);

  const totalBitsWithBonuses =
    (Number.isFinite(numericTotalBits) ? numericTotalBits : 0) +
    (Number.isFinite(numericReferralBonus) ? numericReferralBonus : 0) +
    (Number.isFinite(numericTelegramBonus) ? numericTelegramBonus : 0) +
    (Number.isFinite(numericLocalBonus) ? numericLocalBonus : 0);

  let totalValueUSD =
    Number.isFinite(totalBitsWithBonuses) && Number.isFinite(numericPrice)
      ? totalBitsWithBonuses * numericPrice
      : 0;

  // Fallback: if bits and price are positive but product is ~0 due to wrong scale, try price without decimals
  if (totalValueUSD < 0.000001 && numericTotalBits > 0 && numericPrice > 0 && numericPrice < 0.000001) {
    const priceNoScale = toNumber(safeData.currentPrice, 0);
    if (priceNoScale > numericPrice) totalValueUSD = totalBitsWithBonuses * priceNoScale;
  }

  // Use value precomputed in hook if available, otherwise take the best fallback
  const hookValue = Number(data?.currentInvestmentValue ?? 0);
  const directFallback = (parseFloat(String(safeData.totalBits)) || 0) * (parseFloat(String(safeData.currentPrice)) || 0);
  const finalValueUSD = Math.max(
    0,
    Number.isFinite(hookValue) ? hookValue : 0,
    Number.isFinite(totalValueUSD) ? totalValueUSD : 0,
    Number.isFinite(directFallback) ? directFallback : 0
  );
  
  // 🔍 DEBUG PORTFOLIO VALUE:
  console.log("🔍 [Portfolio Value DEBUG]:");
  console.log("🔍 safeData.totalBits:", safeData.totalBits, "→ numeric:", numericTotalBits);
  console.log("🔍 safeData.currentPrice:", safeData.currentPrice, "→ numeric:", numericPrice);
  console.log("🔍 totalBitsWithBonuses:", totalBitsWithBonuses);
  console.log("🔍 totalValueUSD(calc):", totalValueUSD);
  console.log("🔍 hook currentInvestmentValue:", hookValue);
  console.log("🔍 directFallback bits*price:", directFallback);
  console.log("🔍 Portfolio Value (final): $", finalValueUSD);
  // Compute ROI locally; normalize invested USD scale if necessary (15d vs 18d)
  const bitsForRoi = Number(safeData.totalBits) || 0;
  const priceForRoi = Number(safeData.currentPrice) || 0;
  const rawInvested =
    Number(
      (safeData.investedUsdFromPurchases ??
        safeData.realInvestedUSD ??
        safeData.investedUSD ??
        0)
    ) || 0;

  const expectedValue = bitsForRoi * priceForRoi;
  let investedUsdForRoi = rawInvested;
  if (bitsForRoi > 0 && priceForRoi > 0 && rawInvested > expectedValue * 10) {
    const c15 = rawInvested / 1e15;
    const c18 = rawInvested / 1e18;
    // choose the closest candidate to expectedValue
    const d15 = Math.abs(c15 - expectedValue);
    const d18 = Math.abs(c18 - expectedValue);
    const candidate = d15 <= d18 ? c15 : c18;
    if (candidate > 0 && candidate < rawInvested) investedUsdForRoi = candidate;
  }

  let computedROI = 0;
  if (bitsForRoi > 0 && investedUsdForRoi > 0 && priceForRoi > 0) {
    const avgEntry = investedUsdForRoi / bitsForRoi;
    if (avgEntry > 0) computedROI = ((priceForRoi - avgEntry) / avgEntry) * 100;
  }
  const roiData = formatROI(computedROI);

  // Holdings-only value (exclude pending rewards): totalBits × currentPrice
  const holdingsOnlyUSD = (Number(safeData.totalBits) || 0) * (Number(safeData.currentPrice) || 0);
  const holdingsOnlyDisplay = formatUSD(holdingsOnlyUSD);
  const portfolioLevel =
    safeData.totalBits > 1000
      ? "Large Holder"
      : safeData.totalBits > 100
      ? "Medium Holder"
      : "Small Holder";
  const portfolioTierHint = "Tiers: Small ≤ 100 $BITS • Medium 101–1000 $BITS • Large > 1000 $BITS";

  // Dynamic Status & Strategy based on ROI and portfolio state
  const roiPercentValue = Number(safeData.roiPercent) || 0;
  const totalRewardsPending =
    (Number(safeData.additionalBonus) || 0) +
    (Number(safeData.referralBonus) || 0) +
    (Number(safeData.telegramBonus) || 0);

  let statusLabel = "Stable";
  if (loading) {
    statusLabel = "Syncing…";
  } else if (safeData.hasError) {
    statusLabel = "Error";
  } else if (!walletAddress) {
    statusLabel = "Not Connected";
  } else if ((Number(safeData.totalBits) || 0) <= 0) {
    statusLabel = "No Holdings";
  } else {
    if (roiPercentValue >= 20) statusLabel = "Performing Well";
    else if (roiPercentValue >= 5) statusLabel = "Positive Trend";
    else if (roiPercentValue > -5) statusLabel = "Stable";
    else if (roiPercentValue > -20) statusLabel = "Under Review";
    else statusLabel = "Risk Alert";
  }

  let strategyText = "Strategy";
  if (statusLabel === "Performing Well" || statusLabel === "Positive Trend") {
    strategyText = totalRewardsPending > 0 ? "Hold & Claim rewards" : "Hold & monitor";
  } else if (statusLabel === "Stable") {
    strategyText = "Accumulate on dips";
  } else if (statusLabel === "Under Review") {
    strategyText = "Review entry; consider DCA";
  } else if (statusLabel === "Risk Alert") {
    strategyText = "Reduce exposure / wait";
  } else if (statusLabel === "No Holdings") {
    strategyText = "Start an entry";
  } else if (statusLabel === "Syncing…") {
    strategyText = "Wait to sync";
  } else if (statusLabel === "Error") {
    strategyText = "Retry";
  }

  // Show wallet connection prompt if no wallet
  if (!walletAddress && !loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>🔌 Connect Your Wallet</h2>
        <p>Please connect your wallet to view your portfolio data.</p>
        <div style={{ marginBottom: '20px' }}>
          <strong>Debug Info:</strong><br/>
          WalletContext Available: {walletContextValue ? "✅ YES" : "❌ NO"}<br/>
          EVM Connect: {walletContextValue?.connectViaMetamask ? "✅ YES" : "❌ NO"} • Solana Connect: {walletContextValue?.connectViaPhantom ? "✅ YES" : "❌ NO"}
        </div>
        <div>
        <button 
            onClick={() => walletContextValue?.connectViaMetamask?.()} 
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: 'linear-gradient(135deg, #9333EA, #14F195)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
              cursor: 'pointer',
              marginRight: 12
          }}
        >
          🦊 Connect MetaMask
        </button>
          <button 
            onClick={() => walletContextValue?.connectViaPhantom?.()} 
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: 'linear-gradient(135deg, #6B21A8, #7C3AED)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            👻 Connect Phantom
          </button>
        </div>
      </div>
    );
  }
  // Formatting with safety fallback in case formatter mis-detects units
  const formattedUSD = formatUSD(finalValueUSD);
  const displayUSD =
    finalValueUSD > 0 && formattedUSD === "$0.00"
      ? `$
        ${finalValueUSD.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`.replace(/\n\s+/g, '')
      : formattedUSD;

  console.log("🧮 displayUSD:", displayUSD, "formattedUSD:", formattedUSD);


  if (loading && walletAddress) {
    return <div className="loading-text">Loading BITS Analytics Data...</div>;
  }
  if (safeData.hasError) {
    return <div className="error-text">⚠️ Error loading blockchain data.</div>;
  }

  return (
    <div>
      <DashboardHeader />
      

      <div className="widget-grid">
        {/* Wallet */}
        <div className="widget holdings">
          <div className="widget-icon">💳</div>
          <div className="widget-title">Wallet Address</div>
          <div className="widget-value">
            {walletAddress ? (
              <a
                href={walletContextValue?.walletType === 'Solana' 
                  ? `https://solscan.io/account/${walletAddress}?cluster=devnet` 
                  : `https://bscscan.com/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="wallet-link"
              >
                {shortenAddress(walletAddress, 6, 4)} ↗
              </a>
            ) : (
              "Not Connected"
            )}
          </div>
          <div className="widget-subtitle">{walletContextValue?.walletType === 'Solana' ? 'Solana Devnet' : 'BSC Network'}</div>
        </div>

        {/* STAKING PROFIT (Dedicated Live) */}
        <div className="widget rewards">
          <div className="widget-icon">💹</div>
          <div className="widget-title">Staking Profit (Live)</div>
          <div className="widget-value">
            {(() => {
              const candidates = [
                Number(stakingPendingFromStakingPage) || 0,
                Number(stakingProfitLive) || 0,
                Number(stakingProfitPerSecondCalc) || 0,
                Number(safeData.stakingProfit) || 0,
                ...(Array.isArray(safeData.stakingBreakdown)
                  ? safeData.stakingBreakdown.map((b) => Number(b?.pending) || 0)
                  : [])
              ];
              const p = Math.max(...candidates.filter((x) => Number.isFinite(x))) || 0;
              if (p >= 1) return `${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $BITS`;
              if (p > 1e-9) return `${p.toFixed(4)} $BITS`;
              return '0.0000 $BITS';
            })()}
          </div>
          <div className="widget-subtitle">
            <a href="/staking" style={{ color: '#14F195', textDecoration: 'none' }}>View Staking →</a>
          </div>
        </div>

        {/* BITS Portfolio Value */}
        <div className="widget holdings">
          <div className="widget-icon">💎</div>
          <div className="widget-title">Portfolio Value</div>
          <div className="widget-value">
            {walletAddress ? 
              (finalValueUSD > 0 ? displayUSD : "$0.00") :
              "Connect Wallet"
            }
          </div>
          <div className="widget-subtitle">
            {walletAddress ? 
              (finalValueUSD > 0 ? "Current Value" : "No Holdings") :
              "Connect to View"
            }
          </div>
        </div>

        {/* $BITS Holdings */}
        <div className="widget holdings">
          <div className="widget-icon">⚡</div>
          <div className="widget-title">$BITS Holdings</div>
          <div className="widget-value">
            {numericTotalBits > 0
              ? `${Math.floor(numericTotalBits).toLocaleString('en-US')} $BITS`
              : (walletAddress ? "0 $BITS" : "Connect Wallet")}
          </div>
          <div className="widget-subtitle">
            {safeData.totalBits > 0 ? "Current Balance" : 
             walletAddress ? "No $BITS Holdings" : "Connect to View"}
          </div>
          
          {/* debug removed */}
        </div>

        {/* $BITS Price */}
        <div className="widget market">
          <div className="widget-icon">🔮</div>
          <div className="widget-title">$BITS Price (Current)</div>
          <div className="widget-value">
            {safeData.currentPrice > 0
              ? formatPrice(safeData.currentPrice)
              : walletAddress 
                ? "Fetching..." 
                : "Connect Wallet"}
          </div>
          <div className="widget-subtitle">
            {safeData.currentPrice > 0 
              ? "BSC Blockchain • CellManager.sol" 
              : walletAddress 
                ? "Connecting to BSC Network..." 
                : "Connect to View Price"}
          </div>
          <div className="widget-extra-info">
            {safeData.currentPrice > 0 && (
              <div className="simple-info-text">
                Exchange listing price expected higher than final presale
              </div>
            )}
          </div>
        </div>

        {/* Total Value (Holdings × Price) */}
        <div className="widget market">
          <div className="widget-icon">🌐</div>
          <div className="widget-title">Total Value</div>
          <div className="widget-value">{holdingsOnlyDisplay}</div>
          <div className="widget-subtitle">Holdings × Price</div>
        </div>

        {/* STAKING (New) */}
        <div className="widget rewards" title={(() => {
          const bd = (safeData.stakingBreakdown || []);
          if (!bd.length) return '';
          const lines = bd.map((b, i) => `#${i+1}: ${b.pending?.toFixed?.(4) || b.pending} $BITS pending • ${b.aprPercent?.toFixed?.(2) || b.aprPercent}% APR • ${Math.floor(b.locked || 0).toLocaleString('en-US')} staked`).join('\n');
          return `Staking breakdown:\n${lines}`;
        })()}>
          <div className="widget-icon">🟣</div>
          <div className="widget-title">Staking</div>
          <div className="widget-value">
            {(safeData.stakingBits || 0) > 0 ? `${Math.floor(Number(safeData.stakingBits) || 0).toLocaleString('en-US')} $BITS` : '0 $BITS'}
          </div>
          <div className="widget-subtitle">
            Profit: {(() => {
              const candidates = [
                Number(stakingPendingFromStakingPage) || 0,
                Number(stakingProfitLive) || 0,
                Number(stakingProfitPerSecondCalc) || 0,
                Number(safeData.stakingProfit) || 0,
                ...(Array.isArray(safeData.stakingBreakdown)
                  ? safeData.stakingBreakdown.map((b) => Number(b?.pending) || 0)
                  : [])
              ];
              const p = Math.max(...candidates.filter((x) => Number.isFinite(x))) || 0;
              if (p >= 1) return `${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $BITS`;
              if (p > 1e-9) return `${p.toFixed(4)} $BITS`;
              return '0.0000 $BITS';
            })()}
          </div>
        </div>

        {/* Performance */}
        <div className="widget market">
          <div className="widget-icon">🚀</div>
          <div className="widget-title">Performance</div>
          <div className="widget-value">
            {`${roiData.arrow} ${roiData.raw.toFixed(1)}%`}
          </div>
          <div className="widget-subtitle">{roiData.analysis}</div>
        </div>

        {/* Transactions */}
        <div className="widget market">
          <div className="widget-icon">⚙️</div>
          <div className="widget-title">Transactions</div>
          <div className="widget-value">
            {formatTransactions(safeData.txCount)}
          </div>
          <div className="widget-subtitle">Activity</div>
        </div>

        {/* Rewards */}
        <div className="widget rewards">
          <div className="widget-icon">🔗</div>
          <div className="widget-title">Referral Rewards</div>
          <div className="widget-value">
            {formatBITS(safeData.referralBonus)}
          </div>
          <div className="widget-subtitle">
            {safeData.referralBonus > 0 ? "Ready to Claim" : "No Rewards"}
          </div>
        </div>

        <div className="widget rewards">
          <div className="widget-icon"><img src={telegramLogo} alt="Telegram" className="widget-icon-img" /></div>
          <div className="widget-title">Telegram Rewards</div>
          <div className="widget-value">
            {(() => {
              const v = Math.floor(toNumber(safeData.telegramBonus, 18));
              return `${v.toLocaleString('en-US')} $BITS`;
            })()}
          </div>
          <div className="widget-subtitle">
            {Math.floor(toNumber(safeData.telegramBonus, 18)) > 0 ? (
              <a href="/rewards-hub" style={{ color: '#14F195', textDecoration: 'none' }}>
                Ready to Claim →
              </a>
            ) : "No Rewards"}
          </div>
        </div>

        {/* Additional Bonus - STRUCTURĂ IDENTICĂ CU CELELALTE WIDGET-URI */}
        <div className="widget rewards">
          <div className="widget-icon">🎁</div>
          <div className="widget-title">Additional Bonus</div>
          <div className="widget-value">
            {safeData.additionalBonus > 0 ? (
              <a href="/rewards-hub" style={{ color: '#ffffff', textDecoration: 'none' }}>
                {formatBITS(safeData.additionalBonus)}
              </a>
            ) : "0.00 $BITS"}
          </div>
          <div className="widget-subtitle">
            {safeData.additionalBonus > 0 ? (
              <>
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#a3e635',
                  marginBottom: 4
                }}>
                  {(() => {
                    const investedPreferred =
                      (safeData.totalUsdFromAdditional && safeData.totalUsdFromAdditional > 0)
                        ? safeData.totalUsdFromAdditional
                        : (safeData.investedUsdFromPurchases && safeData.investedUsdFromPurchases > 0)
                          ? safeData.investedUsdFromPurchases
                          : safeData.realInvestedUSD;
                    return investedPreferred > 0
                      ? `Invested: ${formatUSD(investedPreferred)} • Rate: ${safeData.bonusRate || '0%'}`
                      : "No investments yet";
                  })()}
          </div>
                <a href="/rewards-hub" style={{ color: '#14F195', textDecoration: 'none' }}>
                  Ready to Claim →
                </a>
              </>
            ) : "No Rewards"}
            </div>
        </div>

        {/* System */}
        <div className="widget system">
          <div className="widget-icon"><img src={solanaLogo} alt="Solana" className="widget-icon-img" /></div>
          <div className="widget-title">Solana Investment</div>
          <div className="widget-value">
            {safeData.investedUSDOnSolana > 0
              ? formatUSD(safeData.investedUSDOnSolana)
              : "No Investment"}
          </div>
          <div className="widget-subtitle">SOL Network</div>
        </div>

        <div className="widget system" title={portfolioTierHint}>
          <div className="widget-icon">🎛️</div>
          <div className="widget-title">Portfolio Size</div>
          <div className="widget-value">{portfolioLevel}</div>
          <div className="widget-subtitle">
            {`Total Holdings: ${Math.floor(Number(safeData.totalBits) || 0).toLocaleString('en-US')} $BITS`}
          </div>
        </div>

        <div className="widget system">
          <div className="widget-icon">🔄</div>
          <div className="widget-title">Status</div>
          <div className="widget-value">{statusLabel}</div>
          <div className="widget-subtitle">{strategyText}</div>
        </div>
      </div>
    </div>
  );
};

export default BITSAnalytics;
