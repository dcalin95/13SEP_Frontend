import React, { useState, useEffect, useContext } from "react";
import WalletContext from "../context/WalletContext";
import unifiedRewardsService from "../services/unifiedRewardsService";
import { ethers } from "ethers";
import { CONTRACT_MAP as CONTRACTS } from "../contract/contractMap";
import { toBitsInteger, formatBITS, logBITSConversion } from "../utils/bitsUtils";
import "./RewardsHub.css";

const RewardsHub = () => {
  const { signer, walletAddress } = useContext(WalletContext);
  const [rewards, setRewards] = useState({
    totalPending: 0,
    totalClaimed: 0,
    pendingRewards: [],
    loading: true,
    error: null
  });
  const [additionalBonus, setAdditionalBonus] = useState({
    claimable: 0,
    invested: 0,
    rate: '0%',
    loading: true
  });
  const [claiming, setClaiming] = useState(false);
  const [claimingAdditional, setClaimingAdditional] = useState(false);
  const [stakingAdditional, setStakingAdditional] = useState(false);
  const [staking, setStaking] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Load rewards data
  useEffect(() => {
    if (walletAddress) {
      loadRewards();
      loadAdditionalBonus();
    }
  }, [walletAddress]);

  const loadAdditionalBonus = async () => {
    try {
      console.log("🔄 [RewardsHub] Loading Additional Bonus data...");
      setAdditionalBonus(prev => ({ ...prev, loading: true }));

      const rpcUrl = "https://data-seed-prebsc-1-s1.binance.org:8545/";
      const roProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const additionalRewardRO = new ethers.Contract(CONTRACTS.ADDITIONAL_REWARD.address, CONTRACTS.ADDITIONAL_REWARD.abi, roProvider);
      const nodeRO = new ethers.Contract(CONTRACTS.NODE.address, CONTRACTS.NODE.abi, roProvider);

      // Obțin investițiile din Node.sol
      const purchases = await nodeRO.getUserPurchases(walletAddress);
      let totalUSD = 0;
      if (purchases && purchases.length > 0) {
        totalUSD = purchases.reduce((acc, purchase) => {
          const amount = ethers.BigNumber.from(purchase[2] || 0);
          return acc.add(amount);
        }, ethers.BigNumber.from(0));
        totalUSD = parseFloat(ethers.utils.formatUnits(totalUSD, 18));
      }

      // Obțin claimable reward din AdditionalReward.sol
      const claimableReward = await additionalRewardRO.calculateClaimableReward(walletAddress);
      let claimableBITSFloat = parseFloat(ethers.utils.formatUnits(claimableReward, 18));
      let claimableBITS = toBitsInteger(claimableBITSFloat); // Convert to integer for node.sol

      // Dacă nu e claimable din contract, calculez estimativ
      let rate = "0%";
      if (claimableBITS === 0 && totalUSD > 0) {
        let estimatedRate = 0;
        if (totalUSD >= 2500) estimatedRate = 15;
        else if (totalUSD >= 1000) estimatedRate = 10;  
        else if (totalUSD >= 500) estimatedRate = 7;
        else if (totalUSD >= 250) estimatedRate = 5;
        
        if (estimatedRate > 0) {
          rate = `${estimatedRate}%`;
          const bonusUSD = (totalUSD * estimatedRate) / 100;
          claimableBITS = bonusUSD; // Presupun $1 per BITS
        }
      }

      setAdditionalBonus({
        claimable: claimableBITS,
        invested: totalUSD,
        rate: rate,
        loading: false
      });

      console.log("✅ [RewardsHub] Additional Bonus loaded:", {
        claimable: claimableBITS,
        invested: totalUSD,
        rate: rate
      });

    } catch (error) {
      console.error("❌ [RewardsHub] Error loading additional bonus:", error);
      setAdditionalBonus(prev => ({ ...prev, loading: false }));
    }
  };

  const loadRewards = async () => {
    try {
      console.log("🔄 RewardsHub: Loading rewards for wallet:", walletAddress);
      setRewards(prev => ({ ...prev, loading: true }));
      
      // Get unified rewards
      const unifiedData = await unifiedRewardsService.getRewardsSummary(walletAddress);
      console.log("📋 RewardsHub: Unified rewards data:", unifiedData);
      
      // Get Telegram rewards separately
      let telegramRewards = { pending: 0, claimed: 0 };
      try {
        const telegramResponse = await fetch(`https://backend-server-f82y.onrender.com/api/telegram-rewards/reward/${walletAddress}`);
        if (telegramResponse.ok) {
          const telegramData = await telegramResponse.json();
          console.log("💬 RewardsHub: Telegram rewards data:", telegramData);
          telegramRewards = {
            pending: telegramData.eligible && telegramData.reward > 0 ? telegramData.reward : 0,
            claimed: 0, // Telegram rewards are always pending until claimed
            timeSpent: telegramData.time_spent_hours || 0,
            messages: telegramData.messages_total || 0
          };
        }
      } catch (telegramError) {
        console.warn("⚠️ RewardsHub: Could not fetch Telegram rewards:", telegramError);
      }
      
      // Get Invite/Referral code info
      let inviteRewards = { pending: 0, claimed: 0, hasCode: false };
      try {
        const inviteResponse = await fetch(`https://backend-server-f82y.onrender.com/api/invite/check-code/${walletAddress}`);
        if (inviteResponse.ok) {
          const inviteData = await inviteResponse.json();
          console.log("👥 RewardsHub: Invite data:", inviteData);
          inviteRewards = {
            pending: 0, // Invite rewards come from purchases, not having a code
            claimed: 0,
            hasCode: inviteData.hasCode || false,
            code: inviteData.code || null
          };
        }
      } catch (inviteError) {
        console.warn("⚠️ RewardsHub: Could not fetch invite data:", inviteError);
      }
      
      // Combine all rewards
      const totalPending = (unifiedData.totalPending || 0) + telegramRewards.pending;
      const totalClaimed = (unifiedData.totalClaimed || 0) + telegramRewards.claimed;
      
      // Create combined pending rewards list
      const pendingRewards = [...(unifiedData.pendingRewards || [])];
      if (telegramRewards.pending > 0) {
        pendingRewards.push({
          id: 'telegram-activity',
          reward_type: 'telegram',
          amount: telegramRewards.pending,
          created_at: new Date().toISOString(),
          description: `Telegram Activity: ${telegramRewards.timeSpent}h, ${telegramRewards.messages} messages`
        });
      }
      
      console.log("✅ RewardsHub: Combined rewards calculated:", {
        totalPending,
        totalClaimed,
        pendingCount: pendingRewards.length
      });
      
      setRewards({
        wallet: walletAddress,
        totalPending,
        totalClaimed,
        pendingRewards,
        telegram: telegramRewards,
        invite: inviteRewards,
        unified: unifiedData,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("❌ RewardsHub: Error loading rewards:", error);
      setRewards(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Claim rewards to wallet
  const handleClaimToWallet = async () => {
    if (rewards.pendingRewards.length === 0) {
      setStatusMsg("❌ No pending rewards to claim");
      return;
    }

    try {
      setClaiming(true);
      setStatusMsg("🔄 Claiming rewards to your wallet...");

      const result = await unifiedRewardsService.claimAllRewards(walletAddress);
      
      if (result.success) {
        setStatusMsg(`🎉 Successfully claimed ${result.totalAmount} $BITS to your wallet!`);
        await loadRewards(); // Refresh data
      } else {
        throw new Error(result.error || "Claim failed");
      }
    } catch (error) {
      console.error("❌ Claim failed:", error);
      setStatusMsg(`❌ Claim failed: ${error.message}`);
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimAdditionalBonus = async () => {
    if (!signer || additionalBonus.claimable <= 0) return;

    setClaimingAdditional(true);
    setStatusMsg("🔄 Claiming Additional Bonus...");

    try {
      const additionalRewardContract = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      const tx = await additionalRewardContract.claimReward();
      console.log("📤 [RewardsHub] Claim transaction sent:", tx.hash);
      
      setStatusMsg("⏳ Transaction submitted, waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ [RewardsHub] Claim transaction confirmed:", receipt);
      
      setStatusMsg("🎉 Additional Bonus claimed successfully!");
      
      // Refresh data
      await loadAdditionalBonus();
      
    } catch (error) {
      console.error("❌ [RewardsHub] Additional Bonus claim error:", error);
      
      if (error.code === 4001) {
        setStatusMsg("❌ Transaction cancelled by user");
      } else if (error.message.includes("insufficient funds")) {
        setStatusMsg("❌ Insufficient BNB for gas fees");
      } else if (error.message.includes("No claimable")) {
        setStatusMsg("❌ No claimable rewards available");
      } else {
        setStatusMsg("❌ Error claiming bonus: " + error.message);
      }
    } finally {
      setClaimingAdditional(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  const handleStakeAdditionalBonus = async () => {
    if (!signer || additionalBonus.claimable <= 0) return;

    setStakingAdditional(true);
    setStatusMsg("🔄 Claiming and staking Additional Bonus...");

    try {
      const additionalRewardContract = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      // First claim the additional bonus
      const tx = await additionalRewardContract.claimReward();
      console.log("📤 [RewardsHub] Additional Bonus claim transaction sent:", tx.hash);
      
      setStatusMsg("⏳ Claiming Additional Bonus, waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ [RewardsHub] Additional Bonus claim confirmed:", receipt);
      
      // Then redirect to staking with the claimed amount  
      const claimedAmount = toBitsInteger(additionalBonus.claimable);
      setStatusMsg(`✅ Claimed ${claimedAmount} $BITS! Redirecting to staking...`);
      
      // Refresh data
      await loadAdditionalBonus();
      
      // Redirect to staking page with pre-filled amount
      setTimeout(() => {
        window.location.href = `/staking?amount=${claimedAmount}&source=additional-bonus`;
      }, 2000);
      
    } catch (error) {
      console.error("❌ [RewardsHub] Additional Bonus stake error:", error);
      
      if (error.code === 4001) {
        setStatusMsg("❌ Transaction cancelled by user");
      } else if (error.message.includes("insufficient funds")) {
        setStatusMsg("❌ Insufficient BNB for gas fees");
      } else if (error.message.includes("No claimable")) {
        setStatusMsg("❌ No claimable rewards available");
      } else {
        setStatusMsg("❌ Error staking bonus: " + error.message);
      }
    } finally {
      setStakingAdditional(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  // Stake rewards directly
  const handleStakeRewards = async () => {
    if (rewards.pendingRewards.length === 0) {
      setStatusMsg("❌ No pending rewards to stake");
      return;
    }

    try {
      setStaking(true);
      setStatusMsg("🔄 Claiming and staking your rewards...");

      // First claim rewards
      const claimResult = await unifiedRewardsService.claimAllRewards(walletAddress);
      
      if (!claimResult.success) {
        throw new Error(claimResult.error || "Claim failed");
      }

      // Then redirect to staking with the claimed amount
      const claimedAmount = parseFloat(claimResult.totalAmount);
      setStatusMsg(`✅ Claimed ${claimedAmount} $BITS! Redirecting to staking...`);
      
      // Redirect to staking page with pre-filled amount
      setTimeout(() => {
        window.location.href = `/staking?amount=${claimedAmount}&source=rewards`;
      }, 2000);

    } catch (error) {
      console.error("❌ Stake rewards failed:", error);
      setStatusMsg(`❌ Stake failed: ${error.message}`);
    } finally {
      setStaking(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="rewards-hub">
        <div className="hub-container">
          <h1>🎁 Rewards Hub</h1>
          <div className="connect-wallet-prompt">
            <p>🔌 Please connect your wallet to view and manage your rewards.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rewards-hub">
      <div className="hub-container">
        <h1>🎁 Rewards Hub</h1>
        <p className="hub-subtitle">Claim your rewards directly to wallet or stake them for additional yield</p>

        {/* Rewards Summary */}
        <div className="rewards-summary-card">
          <h2>💰 Your Rewards Summary</h2>
          
          {rewards.loading ? (
            <div className="loading-state">
              <p>⏳ Loading your rewards...</p>
            </div>
          ) : rewards.error ? (
            <div className="error-state">
              <p>⚠️ Error: {rewards.error}</p>
              <button onClick={loadRewards} className="retry-btn">🔄 Retry</button>
            </div>
          ) : (
            <>
              <div className="summary-stats">
                <div className="stat-card">
                  <h3>💎 Total Pending</h3>
                  <p className="stat-value">{Math.round(rewards.totalPending)} $BITS</p>
                </div>
                <div className="stat-card">
                  <h3>✅ Total Claimed</h3>
                  <p className="stat-value">{Math.round(rewards.totalClaimed)} $BITS</p>
                </div>
                <div className="stat-card">
                  <h3>📋 Pending Count</h3>
                  <p className="stat-value">{rewards.pendingRewards.length} rewards</p>
                </div>
              </div>

              {/* Additional Bonus Section */}
              <div className="additional-bonus-section">
                <h3>🎁 Additional Investment Bonus</h3>
                {additionalBonus.loading ? (
                  <div className="loading-state">
                    <p>⏳ Loading bonus data...</p>
                  </div>
                ) : (
                  <div className="bonus-card">
                    <div className="bonus-stats">
                      <div className="bonus-stat">
                        <span className="bonus-label">Available Bonus</span>
                        <span className="bonus-value">{formatBITS(additionalBonus.claimable)}</span>
                      </div>
                      <div className="bonus-stat">
                        <span className="bonus-label">Total Invested</span>
                        <span className="bonus-value">${additionalBonus.invested.toLocaleString()}</span>
                      </div>
                      <div className="bonus-stat">
                        <span className="bonus-label">Bonus Rate</span>
                        <span className="bonus-value">{additionalBonus.rate}</span>
                      </div>
                    </div>
                    
                    {additionalBonus.claimable > 0 && (
                      <div className="bonus-actions">
                        <button
                          onClick={handleClaimAdditionalBonus}
                          disabled={claimingAdditional || stakingAdditional}
                          className="action-btn claim-btn"
                        >
                          {claimingAdditional ? "⏳ Claiming..." : "💳 Claim to Wallet"}
                          <span className="btn-subtitle">Receive {toBitsInteger(additionalBonus.claimable)} $BITS directly</span>
                        </button>
                        
                        <button
                          onClick={handleStakeAdditionalBonus}
                          disabled={claimingAdditional || stakingAdditional}
                          className="action-btn stake-btn"
                        >
                          {stakingAdditional ? "🔄 Processing..." : "🏦 Claim & Stake"}
                          <span className="btn-subtitle">Auto-stake for additional yield</span>
                        </button>
                      </div>
                    )}
                    
                    {additionalBonus.claimable === 0 && additionalBonus.invested > 0 && (
                      <div className="bonus-info">
                        <p>💡 Your bonus is calculated based on your total investment amount.</p>
                        <p>Bonus becomes claimable when investment milestones are reached.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pending Rewards List */}
              {rewards.pendingRewards.length > 0 && (
                <div className="pending-rewards-section">
                  <h3>📋 Pending Rewards</h3>
                  <div className="rewards-list">
                    {rewards.pendingRewards.map((reward) => (
                      <div key={reward.id} className="reward-item">
                        <div className="reward-info">
                          <span className="reward-type">
                            {reward.reward_type === 'telegram' ? '💬' : 
                             reward.reward_type === 'referral' ? '👥' : '🎁'} 
                            {reward.reward_type.charAt(0).toUpperCase() + reward.reward_type.slice(1)}
                          </span>
                          <span className="reward-amount">{toBitsInteger(reward.amount)} $BITS</span>
                        </div>
                        <div className="reward-date">
                          {new Date(reward.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="action-section">
                <h3>🚀 What would you like to do?</h3>
                <div style={{ 
                  background: "rgba(0, 170, 255, 0.1)", 
                  border: "1px solid rgba(0, 170, 255, 0.3)", 
                  borderRadius: "8px", 
                  padding: "12px", 
                  marginBottom: "15px",
                  fontSize: "0.9em",
                  textAlign: "center"
                }}>
                  💡 <strong>Pro Tip:</strong> $BITS can always be staked later! Claim now or stake directly - both options keep your staking flexibility.
                </div>
                
                {rewards.totalPending > 0 ? (
                  <div className="action-buttons">
                    <button
                      onClick={handleClaimToWallet}
                      disabled={claiming || staking}
                      className="action-btn claim-btn"
                    >
                      {claiming ? "🔄 Claiming..." : "💳 Claim to Wallet"}
                      <span className="btn-subtitle">Receive {Math.round(rewards.totalPending)} $BITS directly</span>
                    </button>
                    
                    <button
                      onClick={handleStakeRewards}
                      disabled={claiming || staking}
                      className="action-btn stake-btn"
                    >
                      {staking ? "🔄 Processing..." : "🏦 Claim & Stake"}
                      <span className="btn-subtitle">Auto-stake for additional yield</span>
                    </button>
                  </div>
                ) : (
                  <div className="no-rewards">
                    <p>🎯 No pending rewards to claim</p>
                    <p style={{ fontSize: "0.9em", opacity: 0.8 }}>
                      Keep participating in Telegram activities and referrals to earn more rewards!
                    </p>
                    <a href="/presale" className="back-link">← Back to Presale</a>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {statusMsg && (
                <div className="status-message">
                  <p>{statusMsg}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Additional Info */}
        <div className="info-section">
          <h3>ℹ️ How it works</h3>
          <div className="info-grid">
            <div className="info-card">
              <h4>💳 Claim to Wallet</h4>
              <p>Receive your $BITS directly in your connected wallet. Available immediately for trading, transfers, or <strong>you can stake them later</strong> from the <a href="/staking" style={{ color: "#00ffc3" }}>Staking page</a>.</p>
            </div>
            <div className="info-card">
              <h4>🏦 Claim & Stake</h4>
              <p>Automatically stake your claimed rewards to earn additional yield. Higher rewards but with lock-up period. This is the <strong>fastest way to start earning</strong>.</p>
            </div>
            <div className="info-card">
              <h4>🔄 Flexibility</h4>
              <p><strong>Important:</strong> $BITS can always be staked! You can claim now and stake later, or stake other $BITS you already own. <a href="/staking" style={{ color: "#00aaff" }}>Visit Staking →</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsHub;
