/**
 * Unified Rewards Service
 * Handles all reward-related API calls and data formatting
 */

const BACKEND_URL = 'https://backend-server-f82y.onrender.com';

class UnifiedRewardsService {
  constructor() {
    this.baseURL = BACKEND_URL;
  }

  /**
   * Get all rewards for a user
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} User rewards data
   */
  async getUserRewards(walletAddress) {
    try {
      console.log(`🔄 UnifiedRewardsService: Fetching rewards for ${walletAddress}`);
      
      const response = await fetch(`${this.baseURL}/api/rewards/${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ UnifiedRewardsService: Rewards fetched successfully:`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ UnifiedRewardsService: Error fetching rewards:`, error);
      throw error;
    }
  }

  /**
   * Claim a specific reward
   * @param {string} walletAddress - User's wallet address
   * @param {string} rewardId - ID of the reward to claim
   * @returns {Promise<Object>} Claim result
   */
  async claimReward(walletAddress, rewardId) {
    try {
      console.log(`🎁 UnifiedRewardsService: Claiming reward ${rewardId} for ${walletAddress}`);
      
      const response = await fetch(`${this.baseURL}/api/rewards/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          rewardId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ UnifiedRewardsService: Reward claimed successfully:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ UnifiedRewardsService: Error claiming reward:`, error);
      throw error;
    }
  }

  /**
   * Claim all pending rewards for a user
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} Claim result
   */
  async claimAllRewards(walletAddress) {
    try {
      console.log(`🎁 UnifiedRewardsService: Claiming all rewards for ${walletAddress}`);
      
      const response = await fetch(`${this.baseURL}/api/rewards/claim-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ UnifiedRewardsService: All rewards claimed successfully:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ UnifiedRewardsService: Error claiming all rewards:`, error);
      throw error;
    }
  }

  /**
   * Get formatted rewards summary
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} Formatted rewards summary
   */
  async getRewardsSummary(walletAddress) {
    try {
      const rewardsData = await this.getUserRewards(walletAddress);
      
      if (!rewardsData || !rewardsData.rewards) {
        console.log(`📋 UnifiedRewardsService: No rewards data, generating mock data`);
        return this.generateMockData(walletAddress);
      }

      const rewards = rewardsData.rewards;
      const pendingRewards = rewards.filter(reward => reward.status === 'pending');
      const claimedRewards = rewards.filter(reward => reward.status === 'claimed');
      
      const totalPending = pendingRewards.reduce((sum, reward) => sum + parseFloat(reward.amount || 0), 0);
      const totalClaimed = claimedRewards.reduce((sum, reward) => sum + parseFloat(reward.amount || 0), 0);
      
      const summary = {
        wallet: walletAddress,
        totalPending: this.formatAmount(totalPending),
        totalClaimed: this.formatAmount(totalClaimed),
        pendingRewards: pendingRewards.map(reward => ({
          ...reward,
          amount: this.formatAmount(reward.amount)
        })),
        claimedRewards: claimedRewards.map(reward => ({
          ...reward,
          amount: this.formatAmount(reward.amount)
        })),
        mock: false
      };
      
      console.log(`📊 UnifiedRewardsService: Summary generated:`, summary);
      return summary;
      
    } catch (error) {
      console.warn(`⚠️ UnifiedRewardsService: Error getting summary, using mock data:`, error);
      return this.generateMockData(walletAddress);
    }
  }

  /**
   * Format amount to remove excessive decimals
   * @param {number|string} amount - Amount to format
   * @param {number} decimals - Number of decimal places (default: 0)
   * @returns {number} Formatted amount
   */
  formatAmount(amount, decimals = 0) {
    const num = parseFloat(amount || 0);
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Generate mock data for testing/fallback
   * @param {string} walletAddress - User's wallet address
   * @returns {Object} Mock rewards data
   */
  generateMockData(walletAddress) {
    const mockData = {
      wallet: walletAddress,
      totalPending: 25,
      totalClaimed: 150,
      pendingRewards: [
        {
          id: 'mock-investment-1',
          reward_type: 'investment',
          amount: 15,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Investment bonus - Round 5'
        },
        {
          id: 'mock-referral-1',
          reward_type: 'referral',
          amount: 10,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Referral bonus - 2 successful referrals'
        }
      ],
      claimedRewards: [
        {
          id: 'mock-claimed-1',
          reward_type: 'investment',
          amount: 50,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          claimed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Investment bonus - Round 4'
        }
      ],
      mock: true
    };
    
    console.log(`🎭 UnifiedRewardsService: Generated mock data:`, mockData);
    return mockData;
  }
}

// Export singleton instance
const unifiedRewardsService = new UnifiedRewardsService();
export default unifiedRewardsService;