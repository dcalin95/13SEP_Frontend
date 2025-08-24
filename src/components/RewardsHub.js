import React, { useState, useEffect, useContext } from "react";
import WalletContext from "../context/WalletContext";
import unifiedRewardsService from "../services/unifiedRewardsService";
import { ethers } from "ethers";
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
  const [claiming, setClaiming] = useState(false);
  const [staking, setStaking] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Load rewards data
  useEffect(() => {
    if (walletAddress) {
      loadRewards();
    }
  }, [walletAddress]);

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
                          <span className="reward-amount">{Math.round(parseFloat(reward.amount))} $BITS</span>
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
