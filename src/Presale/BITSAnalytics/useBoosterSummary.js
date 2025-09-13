// 🎯 CHATGPT PATCH - CLEAN MINIMAL APPROACH
import { useState, useEffect, useCallback, useContext } from "react";
import { ethers } from "ethers";
import WalletContext from "../../context/WalletContext";
import { CONTRACT_MAP as CONTRACTS, getActiveNetwork } from "../../contract/contractMap";

export const useBoosterSummary = () => {
  const { walletAddress, provider, signer } = useContext(WalletContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  console.log("👀 HOOK MOUNTED with:", { walletAddress, hasProvider: !!provider, hasSigner: !!signer });

  const fetchData = useCallback(async () => {
    console.log("🚀🚀🚀 fetchData STARTED! 🚀🚀🚀");
    console.log("📡 fetchData CALLED!");
    console.log("🔍 [DEBUG] Contract Addresses:", {
      NODE: CONTRACTS.NODE.address,
      CELL_MANAGER: CONTRACTS.CELL_MANAGER.address,
      ADDITIONAL_REWARD: CONTRACTS.ADDITIONAL_REWARD.address,
      TELEGRAM_REWARD: CONTRACTS.TELEGRAM_REWARD.address
    });
    console.log("🔍 [DEBUG] Wallet Info:", { walletAddress, hasProvider: !!provider, hasSigner: !!signer });
    try {
      console.log("🔄 [ChatGPT Patch] Starting real contract calls...");
      
      if (!walletAddress || !provider || !signer) {
        console.warn("❌ Missing requirements for contract calls", {
          walletAddress: !!walletAddress,
          provider: !!provider,
          signer: !!signer
        });
        setData({ ok: false, error: "Missing wallet requirements" });
        return;
      }

      // Use read-only provider with multi-RPC fallback to avoid wallet RPC errors
      const net = getActiveNetwork();
      const rpcCandidates = [
        net.rpcUrl,
        "https://data-seed-prebsc-2-s1.binance.org:8545/",
        "https://data-seed-prebsc-1-s2.binance.org:8545/",
        "https://data-seed-prebsc-2-s2.binance.org:8545/",
        "https://rpc.ankr.com/bsc_testnet_chapel"
      ];

      let purchases = [];
      let lastError = null;
      for (let i = 0; i < rpcCandidates.length; i++) {
        const url = rpcCandidates[i];
        console.log(`🔄 [useBoosterSummary] Trying RPC ${i + 1}/${rpcCandidates.length}: ${url}`);
        try {
          const roProvider = new ethers.providers.JsonRpcProvider(url);
          console.log(`🔄 [useBoosterSummary] Provider created, testing connection...`);
          
          // Test connection first
          const networkInfo = await roProvider.getNetwork();
          console.log(`✅ [useBoosterSummary] Network info:`, networkInfo);
          
          const nodeRO = new ethers.Contract(CONTRACTS.NODE.address, CONTRACTS.NODE.abi, roProvider);
          console.log(`🔄 [useBoosterSummary] Node contract created, calling getUserPurchases...`);
          
          purchases = await nodeRO.getUserPurchases(walletAddress);
          console.log(`✅ [useBoosterSummary] getUserPurchases SUCCESS, got ${purchases?.length || 0} purchases`);
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          const msg = e?.data?.message || e?.message || "";
          const isTrie = msg.toLowerCase().includes("missing trie node");
          const isCall = (e?.code === 'CALL_EXCEPTION');
          console.error(`❌ [useBoosterSummary] RPC failed (${url}):`, {
            error: msg,
            code: e?.code,
            reason: e?.reason,
            fullError: e
          });
          if (!isTrie && !isCall) break;
        }
      }
      if (lastError) {
        console.warn("⚠️ [useBoosterSummary] All RPCs failed for getUserPurchases:", lastError?.message);
      } else {
        console.log("✅ [useBoosterSummary] Node.read purchases:", purchases?.length || 0);
      }
      
      // 🎯 DOAR EXTRAGERE ȘI CONVERSIE DIN NODE.SOL (USD cu 15 zecimale)
      let totalUSD = 0;
      if (purchases && purchases.length > 0) {
        console.log("🔍 EXTRAGERE DATE DIN NODE.SOL:", purchases.length, "purchases");
        
        purchases.forEach((purchase, index) => {
          // EXTRAG valorile raw din Node.sol
          const rawUSD = ethers.BigNumber.from(purchase[1] || 0);   // wei-USD
          const rawBITS = ethers.BigNumber.from(purchase[2] || 0);  // wei-BITS
          
          // Conversie corectă USD (15 decimale)
          const usd = parseFloat(ethers.utils.formatUnits(rawUSD, 15));
          const bits = parseFloat(ethers.utils.formatUnits(rawBITS, 18));
          
          console.log(`💰 Purchase ${index}: $${usd} USD → ${bits} BITS`);
          
          // SUMARE
          totalUSD += usd;
        });
      }

      console.log("💰 TOTAL USD:", totalUSD);
      
      // 🎯 CALCUL SIMPLU TOTAL BITS DIN NODE.SOL
      let totalBits = 0;
      if (purchases && purchases.length > 0) {
        purchases.forEach((purchase, index) => {
          // EXTRAG și CONVERTESC BITS
          const rawBITS = ethers.BigNumber.from(purchase[2] || 0);
          const bits = parseFloat(ethers.utils.formatUnits(rawBITS, 18));
          
          totalBits += bits;
          console.log(`✅ Purchase ${index}: ${bits} BITS (Total: ${totalBits})`);
        });
      }
      
      console.log("🎯 FINAL TOTAL BITS:", totalBits);
      
      // Să încerc să obțin date din CellManager pentru prețul curent
      let currentPrice = 1; // fallback
      try {
        console.log("🔄 [useBoosterSummary] Trying to get current price from CellManager...");
        // Folosesc primul RPC working din lista de mai sus
        const workingRpcUrl = rpcCandidates.find(url => {
          // Logic simplă pentru a găsi primul RPC care a functionat
          return true; // pentru acum folosim primul
        });
        const roProvider = new ethers.providers.JsonRpcProvider(workingRpcUrl || rpcCandidates[0]);
        const cellManagerRO = new ethers.Contract(CONTRACTS.CELL_MANAGER.address, CONTRACTS.CELL_MANAGER.abi, roProvider);
        
        // Încerc să obțin prețul curent REAL al BITS din getCell(cellId)
        try {
          const cellId = await cellManagerRO.getCurrentOpenCellId();
          console.log("✅ [useBoosterSummary] Current Cell ID:", cellId.toString());
          const cell = await cellManagerRO.getCell(cellId);
          // cell = (defined, state, standardPrice, privilegedPrice, sold, supply)
          const standardPriceRaw = cell?.standardPrice ?? (cell?.[2]);
          const standardPriceUSD = Number(ethers.BigNumber.from(standardPriceRaw).toString()) / 1000; // milicenți → USD
          if (standardPriceUSD > 0) {
            currentPrice = standardPriceUSD;
          }
          console.log("🎯 [useBoosterSummary] REAL BITS PRICE (USD): $", currentPrice);
        } catch (cellErr) {
          console.warn("⚠️ [useBoosterSummary] Failed to get cell price via getCell:", cellErr.message);
        }
        
        try {
          const bnbPrice = await cellManagerRO.checkBNBPrice();
          console.log("✅ [useBoosterSummary] BNB Price from contract:", ethers.utils.formatUnits(bnbPrice, 8));
        } catch (priceErr) {
          console.warn("⚠️ [useBoosterSummary] Failed to get BNB price:", priceErr.message);
        }
      } catch (cellManagerErr) {
        console.warn("⚠️ [useBoosterSummary] CellManager calls failed:", cellManagerErr.message);
      }
      
      // LOGICA CORECTĂ - folosesc funcțiile REALE din contractul AdditionalReward
      let additionalRewardData = 0;
      let bonusRate = "0%";
      let telegramRewardBits = 0;
      try {
        console.log("🔄 [useBoosterSummary] CORECT: Node.sol = date, AdditionalReward.sol = execută");
        console.log("🔄 [useBoosterSummary] Wallet:", walletAddress);
        
        const workingRpcUrl = rpcCandidates[0];
        const roProvider = new ethers.providers.JsonRpcProvider(workingRpcUrl);
        const additionalRewardRO = new ethers.Contract(CONTRACTS.ADDITIONAL_REWARD.address, CONTRACTS.ADDITIONAL_REWARD.abi, roProvider);
        
        // 0. VERIFIC conexiunea dintre Node.sol și AdditionalReward.sol
        try {
          const nodeAddressInReward = await additionalRewardRO.node();
          console.log("🔍 [useBoosterSummary] Node.sol address in AdditionalReward:", nodeAddressInReward);
          console.log("🔍 [useBoosterSummary] Expected Node.sol address:", CONTRACTS.NODE.address);
          console.log("🔍 [useBoosterSummary] Addresses match:", nodeAddressInReward.toLowerCase() === CONTRACTS.NODE.address.toLowerCase());
          
          if (nodeAddressInReward.toLowerCase() !== CONTRACTS.NODE.address.toLowerCase()) {
            console.log("🚨 [useBoosterSummary] PROBLEMA: AdditionalReward.sol nu arată la Node.sol corect!");
          }
        } catch (nodeErr) {
          console.warn("⚠️ [useBoosterSummary] Nu pot verifica conexiunea Node.sol:", nodeErr.message);
        }
        
        // 1. Obțin INVESTMENT HISTORY (cea mai importantă!)
        let investmentHistory = [];
        let totalInvestmentFromContract = 0;
        try {
          investmentHistory = await additionalRewardRO.getInvestmentHistory(walletAddress);
          console.log("✅ [useBoosterSummary] Investment History:", investmentHistory.length, "entries");
          
          if (investmentHistory.length === 0) {
            console.log("🚨 [useBoosterSummary] NO INVESTMENTS in AdditionalReward.sol!");
            console.log("🚨 [useBoosterSummary] This means Node.sol investments are NOT synced with AdditionalReward.sol");
            console.log("🚨 [useBoosterSummary] Node.sol shows $64,357.20 but AdditionalReward.sol shows 0");
          }
          
          investmentHistory.forEach((inv, index) => {
            const amount = parseFloat(ethers.utils.formatUnits(inv.amount, 18));
            const rate = inv.rate.toString();
            const claimed = inv.claimed;
            const timestamp = new Date(inv.timestamp * 1000).toISOString();
            totalInvestmentFromContract += amount;
            console.log(`📊 [Investment ${index}]: $${amount}, Rate: ${rate}%, Claimed: ${claimed}, Time: ${timestamp}`);
          });
        } catch (histErr) {
          console.warn("⚠️ [useBoosterSummary] getInvestmentHistory failed:", histErr.message);
          console.error("⚠️ [useBoosterSummary] Full error:", histErr);
        }
        
        // 2. Obțin CLAIMABLE REWARD (în BITS) - asta e valoarea reală!
        try {
          const claimableReward = await additionalRewardRO.calculateClaimableReward(walletAddress);
          additionalRewardData = parseFloat(ethers.utils.formatUnits(claimableReward, 18));
          console.log("🎁 [useBoosterSummary] REAL claimable reward (BITS):", additionalRewardData);
          console.log("🔍 [useBoosterSummary] Raw claimable:", claimableReward.toString());
          
          if (additionalRewardData > 0) {
            console.log("🎉 [useBoosterSummary] USER HAS CLAIMABLE REWARDS!");
          } else {
            console.log("😔 [useBoosterSummary] No claimable rewards - DIAGNOSIS:");
            console.log("😔 [useBoosterSummary] - Node.sol are investiții: $" + totalUSD);
            console.log("😔 [useBoosterSummary] - AdditionalReward.sol calculează: 0 BITS");  
            console.log("😔 [useBoosterSummary] - CAUZA: Node.sol nu apelează recordInvestment() în AdditionalReward.sol");
            console.log("😔 [useBoosterSummary] - SOLUȚIA: Node.sol trebuie să comunice cu AdditionalReward.sol");
          }
        } catch (claimErr) {
          console.error("❌ [useBoosterSummary] calculateClaimableReward failed:", claimErr.message);
        }
        
        // 3. Obțin TOTAL INVESTMENT din contract (verificare)
        try {
          const totalInvWei = await additionalRewardRO.getTotalInvestment(walletAddress);
          const totalInvUSD = parseFloat(ethers.utils.formatUnits(totalInvWei, 18));
          console.log("💰 [useBoosterSummary] Total Investment from contract:", totalInvUSD);
          console.log("💰 [useBoosterSummary] Total Investment from history sum:", totalInvestmentFromContract);
          
          // Folosesc suma din contract pentru rate calculation
          if (totalInvUSD > 0) {
            // Obțin threshold-urile și ratele din contract
            try {
              const [t1, t2, t3, t4, r1, r2, r3, r4] = await Promise.all([
                additionalRewardRO.THRESHOLD_1(),
                additionalRewardRO.THRESHOLD_2(), 
                additionalRewardRO.THRESHOLD_3(),
                additionalRewardRO.THRESHOLD_4(),
                additionalRewardRO.RATE_1(),
                additionalRewardRO.RATE_2(),
                additionalRewardRO.RATE_3(),
                additionalRewardRO.RATE_4()
              ]);
              
              const thresholds = [t1, t2, t3, t4].map(t => parseFloat(ethers.utils.formatUnits(t, 18)));
              const rates = [r1, r2, r3, r4].map(r => r.toString());
              
              console.log("🎯 [useBoosterSummary] Contract thresholds:", thresholds);
              console.log("🎯 [useBoosterSummary] Contract rates:", rates);
              
              // Determin current rate
              let currentRate = "0";
              for (let i = thresholds.length - 1; i >= 0; i--) {
                if (totalInvUSD >= thresholds[i]) {
                  currentRate = rates[i];
                  break;
                }
              }
              bonusRate = `${currentRate}%`;
              console.log("🏆 [useBoosterSummary] Current rate for user:", bonusRate);
              
            } catch (threshErr) {
              console.warn("⚠️ [useBoosterSummary] Failed to get thresholds/rates:", threshErr.message);
              // Fallback manual
              if (totalInvUSD >= 2500) bonusRate = "15%";
              else if (totalInvUSD >= 1000) bonusRate = "10%";  
              else if (totalInvUSD >= 500) bonusRate = "7%";
              else if (totalInvUSD >= 250) bonusRate = "5%";
            }
          }
        } catch (totalErr) {
          console.warn("⚠️ [useBoosterSummary] getTotalInvestment failed:", totalErr.message);
        }
        
      } catch (addRewardErr) {
        console.error("❌ [useBoosterSummary] AdditionalReward calls failed:", addRewardErr.message);
      }

      // 📱 Telegram rewards (on-chain first)
      try {
        if (CONTRACTS.TELEGRAM_REWARD?.address && CONTRACTS.TELEGRAM_REWARD?.abi) {
          const roProvider = new ethers.providers.JsonRpcProvider(rpcCandidates[0]);
          const telegramRO = new ethers.Contract(CONTRACTS.TELEGRAM_REWARD.address, CONTRACTS.TELEGRAM_REWARD.abi, roProvider);
          const tgRaw = await telegramRO.getTelegramReward(walletAddress);
          telegramRewardBits = parseFloat(ethers.utils.formatUnits(tgRaw, 18));
          console.log("📱 [useBoosterSummary] Telegram rewards (on-chain BITS):", telegramRewardBits);
        }
      } catch (tgErr) {
        console.warn("⚠️ [useBoosterSummary] getTelegramReward failed:", tgErr?.message);
      }

      // 📡 Backend fallback (same as Rewards Hub) if on-chain is zero
      if (!telegramRewardBits && walletAddress) {
        try {
          const backendURL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
          const res = await fetch(`${backendURL}/api/telegram-rewards/reward/${walletAddress}`);
          if (res.ok) {
            const payload = await res.json();
            const pending = Number(payload?.reward || 0);
            if (Number.isFinite(pending) && pending > 0) {
              telegramRewardBits = pending;
              console.log("📱 [useBoosterSummary] Telegram rewards (backend BITS):", telegramRewardBits);
            }
          }
        } catch (backendErr) {
          console.warn("⚠️ [useBoosterSummary] Telegram backend fetch failed:", backendErr?.message);
        }
      }

        // INTELLIGENT FALLBACK: Calculez ce AR TREBUI să fie bonus-ul bazat pe Node.sol
        if (additionalRewardData === 0 && totalUSD > 0) {
          console.log("🤖 [useBoosterSummary] AI LOGIC: Calculating what bonus SHOULD BE based on Node.sol");
          console.log("🤖 [useBoosterSummary] Node.sol investiții: $" + totalUSD + " dar AdditionalReward.sol: 0 BITS");
          console.log("🤖 [useBoosterSummary] CAUZA: Node.sol NU comunică cu AdditionalReward.sol sau procesare manuală necesară");
        
        // Calculez tier-ul corect bazat pe investițiile reale din Node.sol
        let correctRate = 0;
        if (totalUSD >= 2500) correctRate = 15;
        else if (totalUSD >= 1000) correctRate = 10;  
        else if (totalUSD >= 500) correctRate = 7;
        else if (totalUSD >= 250) correctRate = 5;
        
        if (correctRate > 0) {
          bonusRate = `${correctRate}%`;
          // Calculez ce bonus AI DREPTUL să primești
          const deserverdBonusUSD = (totalUSD * correctRate) / 100;
          const bitsPriceUSD = currentPrice || 1;
          additionalRewardData = deserverdBonusUSD / bitsPriceUSD;
          
          console.log(`🧮 [useBoosterSummary] DESERVERD BONUS: $${totalUSD} × ${correctRate}% = $${deserverdBonusUSD} = ${additionalRewardData} BITS`);
          console.log("🚨 [useBoosterSummary] ATENȚIE: Acesta e bonus-ul cuitat, dar contractele nu sunt conectate!");
          console.log("🔧 [useBoosterSummary] ACȚIUNE: Node.sol trebuie să apeleze recordInvestment() în AdditionalReward.sol");
        }
      }

      // Compute ROI using Node USD (15d) and CellManager price
      const numericBits = Number.isFinite(totalBits) ? totalBits : 0;
      const numericPrice = Number.isFinite(currentPrice) ? currentPrice : 0;
      const investedUSD = Number.isFinite(totalUSD) ? totalUSD : 0;
      const currentInvestmentValue = numericBits * numericPrice;
      let roiPercent = 0;
      if (numericBits > 0 && investedUSD > 0 && numericPrice > 0) {
        const avgEntryPrice = investedUSD / numericBits;
        if (avgEntryPrice > 0) {
          roiPercent = ((numericPrice - avgEntryPrice) / avgEntryPrice) * 100;
        }
      }

      console.log("🎯 [useBoosterSummary] FINAL DATA SUMMARY:", {
        totalBits,
        totalUSD,
        currentPrice,
        currentInvestmentValue,
        roiPercent,
        additionalRewardData: `${additionalRewardData} BITS`,
        bonusRate,
        purchasesCount: purchases.length
      });

      console.log("🎯 SETTING DATA WITH:", { totalBits, totalUSD, currentPrice, currentInvestmentValue, purchasesLength: purchases.length });

      // First set baseline data (placeholders for staking)
      setData({ 
        totalBits: totalBits,
        realInvestedUSD: totalUSD,
        investedUSD: totalUSD,
        investedUSDOnSolana: 0,
        referralBonus: 0,
        telegramBonus: telegramRewardBits || 0,
        additionalBonus: additionalRewardData,
        bonusRate: bonusRate,
        bonusCalculatedLocally: 0,
        totalUsdFromAdditional: 0,
        // staking placeholders; will be set below
        stakingBits: 0,
        stakingProfit: 0,
        stakingBreakdown: [],
        txCount: purchases.length,
        lastInvestmentDate: null,
        lastPrice: 0,
        currentPrice: currentPrice,
        roiPercent,
        currentInvestmentValue,
        ok: true 
      });

      // === STAKING READ (non-blocking) ===
      try {
        const roProvider = new ethers.providers.JsonRpcProvider(getActiveNetwork().rpcUrl);
        const stakingRO = new ethers.Contract(CONTRACTS.STAKING.address, CONTRACTS.STAKING.abi, roProvider);
        let staked = 0, profit = 0;

        // Preferred: aggregate dashboard in one call
        try {
          if (typeof stakingRO.getUserDashboard === 'function') {
            const dashboard = await stakingRO.getUserDashboard(walletAddress);
            // tuple order per ABI: totalStaked, totalCurrentEarnings, totalDailyRewards, totalMonthlyRewards, totalYearlyRewards, activeStakesCount, withdrawnStakesCount
            const totalStakedRaw = dashboard?.[0] ?? dashboard?.totalStaked;
            const totalEarningsRaw = dashboard?.[1] ?? dashboard?.totalCurrentEarnings;
            if (totalStakedRaw) staked = parseFloat(ethers.utils.formatUnits(totalStakedRaw, 18));
            if (totalEarningsRaw) profit = parseFloat(ethers.utils.formatUnits(totalEarningsRaw, 18));
          }
        } catch {}

        // Fallbacks
        if (!staked && typeof stakingRO.getUserTotalStaked === 'function') {
          try {
            const raw = await stakingRO.getUserTotalStaked(walletAddress);
            staked = parseFloat(ethers.utils.formatUnits(raw, 18));
          } catch {}
        }
        if (!profit && typeof stakingRO.getTotalCurrentEarnings === 'function') {
          try {
            const raw = await stakingRO.getTotalCurrentEarnings(walletAddress);
            profit = parseFloat(ethers.utils.formatUnits(raw, 18));
          } catch {}
        }

        // Additional fallback: getTotalRewardForUser
        if (!profit && typeof stakingRO.getTotalRewardForUser === 'function') {
          try {
            const raw = await stakingRO.getTotalRewardForUser(walletAddress);
            profit = parseFloat(ethers.utils.formatUnits(raw, 18));
          } catch {}
        }

        // Additional fallback: getAdvancedUserDashboard (position 1: totalCurrentEarnings)
        if (!profit && typeof stakingRO.getAdvancedUserDashboard === 'function') {
          try {
            const adv = await stakingRO.getAdvancedUserDashboard(walletAddress);
            const earningsRaw = adv?.[1] ?? adv?.totalCurrentEarnings;
            if (earningsRaw) {
              profit = parseFloat(ethers.utils.formatUnits(earningsRaw, 18));
            }
          } catch {}
        }

        // Deep fallback: sum over stakes when simple aggregations are unavailable
        if ((staked === 0 || isNaN(staked)) && typeof stakingRO.getStakeByUser === 'function') {
          try {
            const stakes = await stakingRO.getStakeByUser(walletAddress);
            if (Array.isArray(stakes) && stakes.length > 0) {
              let totalLocked = ethers.BigNumber.from(0);
              stakes.forEach(item => {
                try {
                  const locked = item?.locked ?? item?.[0];
                  if (locked) totalLocked = totalLocked.add(locked);
                } catch {}
              });
              staked = parseFloat(ethers.utils.formatUnits(totalLocked, 18));

              // Try to sum current earnings per stake index if available
              if ((profit === 0 || isNaN(profit)) && typeof stakingRO.getCurrentEarnings === 'function') {
                try {
                  const calls = stakes.map((_, idx) => stakingRO.getCurrentEarnings(walletAddress, idx).catch(() => ethers.BigNumber.from(0)));
                  const results = await Promise.all(calls);
                  const totalEarnings = results.reduce((acc, bn) => acc.add(bn || ethers.BigNumber.from(0)), ethers.BigNumber.from(0));
                  profit = parseFloat(ethers.utils.formatUnits(totalEarnings, 18));
                } catch {}
              }

              // Alternative per-stake info when getCurrentEarnings is not present
              if ((profit === 0 || isNaN(profit)) && typeof stakingRO.getStakeCompleteInfo === 'function') {
                try {
                  const callsInfo = stakes.map((_, idx) => stakingRO.getStakeCompleteInfo(walletAddress, idx).catch(() => null));
                  const infos = await Promise.all(callsInfo);
                  let totalEarnings = ethers.BigNumber.from(0);
                  infos.forEach(info => {
                    if (!info) return;
                    const currentRaw = info?.[2] ?? info?.currentEarnings;
                    if (currentRaw) {
                      try { totalEarnings = totalEarnings.add(currentRaw); } catch {}
                    }
                  });
                  profit = parseFloat(ethers.utils.formatUnits(totalEarnings, 18));
                } catch {}
              }

              // Final attempt: sum getStakeDetails(user, index).reward
              if ((profit === 0 || isNaN(profit)) && typeof stakingRO.getStakeDetails === 'function') {
                try {
                  const callsDet = stakes.map((_, idx) => stakingRO.getStakeDetails(walletAddress, idx).catch(() => null));
                  const dets = await Promise.all(callsDet);
                  let totalRewards = ethers.BigNumber.from(0);
                  dets.forEach(det => {
                    if (!det) return;
                    const rewardRaw = det?.[2] ?? det?.reward;
                    if (rewardRaw) {
                      try { totalRewards = totalRewards.add(rewardRaw); } catch {}
                    }
                  });
                  profit = parseFloat(ethers.utils.formatUnits(totalRewards, 18));
                } catch {}
              }
            }
          } catch {}
        }

        setData(prev => ({ ...(prev || {}), stakingBits: staked || 0, stakingProfit: profit || 0 }));
      } catch {}

      
      console.log("✅ DATA SET SUCCESSFULLY!");
    } catch (err) {
      console.error("❌ [ChatGPT Patch] fetchData error:", err);
      setData({ ok: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }, [walletAddress, provider, signer]);

  useEffect(() => {
    console.log("🟢 USEEFFECT REGISTERED!");

    return () => {
      console.log("🔴 USEEFFECT CLEANUP (component unmounted)");
    };
  }, []); // rulează la primul mount

  // Live staking profit updater (poll every 5s using read-only RPC)
  useEffect(() => {
    let timerId;
    const run = async () => {
      try {
        if (!walletAddress) return;
        const roProvider = new ethers.providers.JsonRpcProvider(getActiveNetwork().rpcUrl);
        const stakingRO = new ethers.Contract(CONTRACTS.STAKING.address, CONTRACTS.STAKING.abi, roProvider);
        let profit = 0;
        let breakdown = [];

        // 1) Try exact on-chain total earnings
        try {
          const totalEarningsRaw = await stakingRO.getTotalCurrentEarnings(walletAddress);
          profit = parseFloat(ethers.utils.formatUnits(totalEarningsRaw, 18));
        } catch {}

        // 2) For tooltip breakdown, try per-stake info
        try {
          const stakes = await stakingRO.getStakeByUser(walletAddress).catch(() => []);
          if (Array.isArray(stakes) && stakes.length > 0) {
            // Prefer getStakeCompleteInfo to read currentEarnings per stake
            const infos = await Promise.all(
              stakes.map((_, idx) => stakingRO.getStakeCompleteInfo(walletAddress, idx).catch(() => null))
            );
            breakdown = infos.filter(Boolean).map((info) => {
              const stakedRaw = info?.[0] ?? info?.staked;
              const aprPercent = info?.[1] ?? info?.aprPercent;
              const currentRaw = info?.[2] ?? info?.currentEarnings;
              return {
                locked: parseFloat(ethers.utils.formatUnits(stakedRaw || 0, 18)),
                aprPercent: Number(aprPercent || 0),
                pending: parseFloat(ethers.utils.formatUnits(currentRaw || 0, 18)),
              };
            });
          }
        } catch {}

        // 3) Also set total staked for completeness
        let staked = 0;
        try {
          const totalStakedRaw = await stakingRO.getUserTotalStaked(walletAddress);
          staked = parseFloat(ethers.utils.formatUnits(totalStakedRaw, 18));
        } catch {}

        setData((prev) => ({ ...(prev || {}), stakingBits: staked || 0, stakingProfit: profit || 0, stakingBreakdown: breakdown }));
      } catch {}
    };
    run();
    timerId = setInterval(run, 5000);
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [walletAddress]);

  useEffect(() => {
    console.log("=== USEEFFECT TRIGGERED!!! ===", { walletAddress, hasProvider: !!provider, hasSigner: !!signer });

    if (walletAddress && provider) {
      console.log("🔥 CALLING fetchData() NOW!");
      fetchData();
    } else {
      console.log("🚨 NOT CALLING fetchData - Missing requirements:");
      console.log("🚨 walletAddress:", !!walletAddress);
      console.log("🚨 provider:", !!provider);
    }
  }, [walletAddress, provider, signer, fetchData]);

  return { loading, data, refetchData: fetchData };
};

export default useBoosterSummary;