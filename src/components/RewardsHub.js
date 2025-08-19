import React, { useState, useEffect, useContext } from 'react';
import WalletContext from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import unifiedRewardsService from '../services/unifiedRewardsService';
import './RewardsHub.css';

const RewardsHub = () => {
  const { walletAddress } = useContext(WalletContext);
  const navigate = useNavigate();
  
  const [rewards, setRewards] = useState({
    wallet: null,
    totalPending: 0,
    totalClaimed: 0,
    pendingRewards: [],
    telegram: { pending: 0, claimed: 0, timeSpent: 0, messages: 0 },
    invite: { pending: 0, claimed: 0, hasCode: false, code: null },
    unified: { totalPending: 0, totalClaimed: 0, pendingRewards: [] },
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [claiming, setClaiming] = useState({
    individual: {},
    all: false
  });

  useEffect(() => {
    if (walletAddress) {
      loadRewards();
    }
  }, [walletAddress]);

  const loadRewards = async () => {
    try {
      console.log("🔄 RewardsHub: Loading rewards for wallet:", walletAddress);
      setRewards(prev => ({ ...prev, loading: true }));

      // Fetch unified rewards
      const unifiedData = await unifiedRewardsService.getRewardsSummary(walletAddress);
      console.log("📋 RewardsHub: Unified rewards data:", unifiedData);

      // Fetch Telegram rewards
      let telegramRewards = { pending: 0, claimed: 0 };
      try {
        const telegramResponse = await fetch(`https://backend-server-f82y.onrender.com/api/telegram-rewards/reward/${walletAddress}`);
        if (telegramResponse.ok) {
          const telegramData = await telegramResponse.json();
          console.log("💬 RewardsHub: Telegram rewards data:", telegramData);
          telegramRewards = {
            pending: telegramData.eligible && telegramData.reward > 0 ? telegramData.reward : 0,
            claimed: 0, // Telegram doesn't track claimed yet
            timeSpent: telegramData.time_spent_hours || 0,
            messages: telegramData.messages_total || 0
          };
        }
      } catch (telegramError) {
        console.warn("⚠️ RewardsHub: Could not fetch Telegram rewards:", telegramError);
      }

      // Fetch invite/referral data (OPTIMIZED: use same cache as PaymentBox)
      let inviteRewards = { pending: 0, claimed: 0, hasCode: false };
      try {
        // 🚀 Check session cache first (same key as PaymentBox for consistency)
        const cacheKey = `referral_data_${walletAddress}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (Date.now() - parsed.timestamp < CACHE_DURATION && parsed.inviteCode !== undefined) {
              console.log("🚀 RewardsHub: Using cached invite data for:", walletAddress);
              inviteRewards = {
                pending: 0,
                claimed: 0,
                hasCode: !!parsed.inviteCode,
                code: parsed.inviteCode || null
              };
            } else {
              // Cache miss - fetch fresh data
              const inviteResponse = await fetch(`https://backend-server-f82y.onrender.com/api/invite/check-code/${walletAddress}`);
              if (inviteResponse.ok) {
                const inviteData = await inviteResponse.json();
                console.log("👥 RewardsHub: Fresh invite data:", inviteData);
                inviteRewards = {
                  pending: 0,
                  claimed: 0,
                  hasCode: inviteData.hasCode || false,
                  code: inviteData.code || null
                };
              }
            }
          } catch (parseError) {
            // Cache parse error - fetch fresh data as fallback
            const inviteResponse = await fetch(`https://backend-server-f82y.onrender.com/api/invite/check-code/${walletAddress}`);
            if (inviteResponse.ok) {
              const inviteData = await inviteResponse.json();
              inviteRewards = {
                pending: 0,
                claimed: 0,
                hasCode: inviteData.hasCode || false,
                code: inviteData.code || null
              };
            }
          }
        } else {
          // No cache - fetch fresh data
          const inviteResponse = await fetch(`https://backend-server-f82y.onrender.com/api/invite/check-code/${walletAddress}`);
          if (inviteResponse.ok) {
            const inviteData = await inviteResponse.json();
            console.log("👥 RewardsHub: Fresh invite data:", inviteData);
            inviteRewards = {
              pending: 0,
              claimed: 0,
              hasCode: inviteData.hasCode || false,
              code: inviteData.code || null
            };
          }
        }
      } catch (inviteError) {
        console.warn("⚠️ RewardsHub: Could not fetch invite data:", inviteError);
      }

      // Calculate totals
      const totalPending = (unifiedData.totalPending || 0) + telegramRewards.pending;
      const totalClaimed = (unifiedData.totalClaimed || 0) + telegramRewards.claimed;

      // Build pending rewards list
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
      setRewards(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const claimReward = async (rewardId) => {
    try {
      setClaiming(prev => ({ ...prev, individual: { ...prev.individual, [rewardId]: true } }));
      
      if (rewardId === 'telegram-activity') {
        // Handle Telegram reward claiming (if implemented)
        console.log("🎁 Claiming Telegram reward...");
        // For now, just simulate success
        setTimeout(() => {
          setClaiming(prev => ({ ...prev, individual: { ...prev.individual, [rewardId]: false } }));
          loadRewards(); // Reload to update state
        }, 2000);
        return;
      }

      // Handle unified system rewards
      const result = await unifiedRewardsService.claimReward(walletAddress, rewardId);
      console.log("✅ RewardsHub: Reward claimed:", result);
      
      // Reload rewards after successful claim
      await loadRewards();
      
    } catch (error) {
      console.error("❌ RewardsHub: Error claiming reward:", error);
      alert(`Error claiming reward: ${error.message}`);
    } finally {
      setClaiming(prev => ({ ...prev, individual: { ...prev.individual, [rewardId]: false } }));
    }
  };

  const claimAllRewards = async () => {
    try {
      setClaiming(prev => ({ ...prev, all: true }));
      
      // Claim all unified rewards
      if (rewards.unified.totalPending > 0) {
        const result = await unifiedRewardsService.claimAllRewards(walletAddress);
        console.log("✅ RewardsHub: All unified rewards claimed:", result);
      }

      // Handle Telegram rewards if any
      if (rewards.telegram.pending > 0) {
        console.log("🎁 Claiming all Telegram rewards...");
        // Simulate Telegram claim
      }

      // Reload rewards after successful claims
      await loadRewards();
      
    } catch (error) {
      console.error("❌ RewardsHub: Error claiming all rewards:", error);
      alert(`Error claiming rewards: ${error.message}`);
    } finally {
      setClaiming(prev => ({ ...prev, all: false }));
    }
  };

  const handleClaimToWallet = async () => {
    if (rewards.totalPending > 0) {
      await claimAllRewards();
      alert(`🎉 Successfully claimed ${Math.round(rewards.totalPending)} BITS to your wallet!`);
    }
  };

  const handleClaimAndStake = async () => {
    if (rewards.totalPending > 0) {
      await claimAllRewards();
      // Navigate to staking with pre-filled amount
      navigate(`/staking?amount=${Math.round(rewards.totalPending)}&source=rewards`);
    }
  };

  if (!walletAddress) {
    return (
      <div className="rewards-hub">
        <div className="rewards-container">
          <div className="wallet-connect-prompt">
            <h2>🔗 Connect Your Wallet</h2>
            <p>Please connect your wallet to view and claim your rewards.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rewards-hub">
      <div className="rewards-container">
        <div className="rewards-header">
          <h1>🎁 Rewards Hub</h1>
          <p>Manage all your $BITS rewards in one place</p>
        </div>

        {rewards.loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your rewards...</p>
          </div>
        )}

        {rewards.error && (
          <div className="error-state">
            <h3>❌ Error Loading Rewards</h3>
            <p>{rewards.error}</p>
            <button onClick={loadRewards} className="retry-btn">🔄 Retry</button>
          </div>
        )}

        {!rewards.loading && !rewards.error && (
          <>
            {/* Summary Section */}
            <div className="rewards-summary">
              <div className="summary-cards">
                <div className="summary-card pending">
                  <h3>💰 Pending Rewards</h3>
                  <div className="amount">{Math.round(rewards.totalPending)} $BITS</div>
                  <p>{rewards.pendingRewards.length} reward(s) available</p>
                </div>
                
                <div className="summary-card claimed">
                  <h3>✅ Claimed Rewards</h3>
                  <div className="amount">{Math.round(rewards.totalClaimed)} $BITS</div>
                  <p>Total claimed to date</p>
                </div>
                
                <div className="summary-card activity">
                  <h3>📊 Activity Stats</h3>
                  <div className="activity-stats">
                    <div>💬 {rewards.telegram.timeSpent}h Telegram</div>
                    <div>📨 {rewards.telegram.messages} Messages</div>
                    <div>🔗 {rewards.invite.hasCode ? 'Code Generated' : 'No Code'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {rewards.totalPending > 0 && (
              <div className="action-buttons">
                <button 
                  onClick={handleClaimToWallet}
                  disabled={claiming.all}
                  className="action-btn claim-btn"
                >
                  {claiming.all ? (
                    <>🔄 Claiming...</>
                  ) : (
                    <>💰 Claim to Wallet</>
                  )}
                </button>
                
                <button 
                  onClick={handleClaimAndStake}
                  disabled={claiming.all}
                  className="action-btn stake-btn"
                >
                  {claiming.all ? (
                    <>🔄 Processing...</>
                  ) : (
                    <>🔐 Claim & Stake</>
                  )}
                </button>
              </div>
            )}

            {/* Pending Rewards List */}
            {rewards.pendingRewards.length > 0 && (
              <div className="pending-rewards">
                <h3>📋 Pending Rewards</h3>
                <div className="rewards-list">
                  {rewards.pendingRewards.map((reward) => (
                    <div key={reward.id} className="reward-item">
                      <div className="reward-info">
                        <div className="reward-type">
                          {reward.reward_type === 'telegram' && '💬 Telegram Activity'}
                          {reward.reward_type === 'referral' && '👥 Referral Bonus'}
                          {reward.reward_type === 'investment' && '💎 Investment Bonus'}
                          {!['telegram', 'referral', 'investment'].includes(reward.reward_type) && `🎁 ${reward.reward_type}`}
                        </div>
                        <div className="reward-description">
                          {reward.description || `${reward.reward_type} reward`}
                        </div>
                        <div className="reward-amount">{Math.round(reward.amount)} $BITS</div>
                      </div>
                      <button
                        onClick={() => claimReward(reward.id)}
                        disabled={claiming.individual[reward.id]}
                        className="claim-individual-btn"
                      >
                        {claiming.individual[reward.id] ? '🔄' : '🎁 Claim'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Cards */}
            <div className="info-cards">
              <div className="info-card">
                <h4>💰 About Claiming</h4>
                <ul>
                  <li>✅ Instant transfer to your wallet</li>
                  <li>🔐 Secure smart contract execution</li>
                  <li>⛽ Gas fees covered by the protocol</li>
                  <li>📊 Transaction history tracked</li>
                </ul>
              </div>
              
              <div className="info-card">
                <h4>🔐 About Staking</h4>
                <ul>
                  <li>🎯 Earn additional rewards by staking</li>
                  <li>⏰ Flexible staking periods available</li>
                  <li>🔄 Unstake anytime (subject to terms)</li>
                  <li>📈 Compound your earnings automatically</li>
                </ul>
              </div>
            </div>

            {/* Footer Info */}
            <div className="rewards-footer">
              <p>
                <strong>💡 Pro Tip:</strong> Claiming and staking your rewards immediately maximizes your earning potential!
              </p>
              {rewards.lastUpdated && (
                <p className="last-updated">
                  Last updated: {new Date(rewards.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RewardsHub;