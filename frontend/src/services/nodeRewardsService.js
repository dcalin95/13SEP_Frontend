/**
 * 🎯 HYBRID REWARDS SERVICE
 * 
 * Conectează frontend-ul direct cu Node.sol smart contract
 * pentru reward management transparent și decentralizat.
 * 
 * HYBRID APPROACH:
 * - Telegram tracking → PostgreSQL (fast performance)
 * - Claims & Display → Node.sol (transparency)
 * - Batch sync → Daily/Weekly automated
 */

import { ethers } from "ethers";
import nodeABI from "../abi/nodeABI.js";

// 🔧 Configuration
const NODE_CONTRACT_ADDRESS = process.env.REACT_APP_NODE_CONTRACT_ADDRESS || "0x2f4ab05e775bD16959F0A7eBD20B8157D336324A";
const BITS_TOKEN_ADDRESS = process.env.REACT_APP_BITS_TOKEN || process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS;
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545";

class NodeRewardsService {
  constructor() {
    this.contract = null;
    this.provider = null;
    this.signer = null;
    this.isConnected = false;
  }

  /**
   * 🔌 Initialize connection to Node.sol contract
   */
  async initialize() {
    try {
      // Use MetaMask if available, fallback to public RPC
      if (window.ethereum) {
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        
        // Check if connected to BSC Testnet
        const network = await this.provider.getNetwork();
        if (network.chainId !== 97) {
          console.warn("⚠️ Not connected to BSC Testnet. Some functions may not work.");
        }
      } else {
        // Fallback to read-only mode
        this.provider = new ethers.providers.JsonRpcProvider(BSC_TESTNET_RPC);
        console.log("📖 Using read-only mode (no MetaMask detected)");
      }

      this.contract = new ethers.Contract(NODE_CONTRACT_ADDRESS, nodeABI, this.signer || this.provider);
      this.isConnected = true;
      
      console.log("✅ NodeRewardsService initialized");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize NodeRewardsService:", error);
      return false;
    }
  }

  /**
   * 🔍 Get user's total reward balance from Node.sol
   * @param {string} userAddress - User's wallet address
   * @returns {Promise<string>} Reward balance in BITS
   */
  async getUserRewardBalance(userAddress) {
    try {
      if (!this.contract) await this.initialize();
      
      const balance = await this.contract.getUserRewardBalance(userAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error("❌ Error getting user reward balance:", error);
      return "0";
    }
  }

  /**
   * 🎁 Get available reward for specific invite code
   * @param {string} inviteCode - Referral/invite code
   * @returns {Promise<Object>} Code balance and reward info
   */
  async getCodeRewardInfo(inviteCode) {
    try {
      if (!this.contract) await this.initialize();
      
      const balance = await this.contract.codeBalanceOf(BITS_TOKEN_ADDRESS, inviteCode);
      const [firstRate, secondRate] = await this.contract.getRefCodeRates(inviteCode);
      
      return {
        codeBalance: ethers.utils.formatEther(balance),
        firstReferralRate: firstRate.toString(),
        secondReferralRate: secondRate.toString(),
        hasRewards: balance.gt(0)
      };
    } catch (error) {
      console.error("❌ Error getting code reward info:", error);
      return {
        codeBalance: "0",
        firstReferralRate: "0",
        secondReferralRate: "0",
        hasRewards: false
      };
    }
  }

  /**
   * 📊 Get additional reward tiers from contract
   * @returns {Promise<Array>} Array of reward tiers {percent, limit}
   */
  async getAdditionalRewardTiers() {
    try {
      if (!this.contract) await this.initialize();
      
      const tiers = await this.contract.getAdditionalRewardInfo();
      
      return tiers.map(tier => ({
        percent: parseFloat(ethers.utils.formatUnits(tier.percent, 2)), // Assuming 2 decimals
        limit: parseFloat(ethers.utils.formatEther(tier.limit))
      }));
    } catch (error) {
      console.error("❌ Error getting additional reward tiers:", error);
      return [];
    }
  }

  /**
   * 🎯 Claim referral code rewards
   * @param {string} inviteCode - Code to claim
   * @param {Array} tokens - Token addresses to claim for
   * @returns {Promise<Object>} Transaction result
   */
  async claimReferralReward(inviteCode, tokens = [BITS_TOKEN_ADDRESS]) {
    try {
      if (!this.signer) {
        throw new Error("Wallet not connected. Please connect MetaMask.");
      }

      const userAddress = await this.signer.getAddress();
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      // Create EIP-712 signature
      const domain = {
        name: "Node",
        version: "1",
        chainId: 97, // BSC Testnet
        verifyingContract: NODE_CONTRACT_ADDRESS,
      };

      const types = {
        Claim: [
          { name: "tokens", type: "address[]" },
          { name: "code", type: "string" },
          { name: "user", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        tokens,
        code: inviteCode,
        user: userAddress,
        deadline,
      };

      const signature = await this.signer._signTypedData(domain, types, value);
      const { r, s, v } = ethers.utils.splitSignature(signature);

      // Execute claim transaction
      const tx = await this.contract.claimRefCode(
        tokens,
        inviteCode,
        deadline,
        v,
        r,
        s
      );

      console.log("🚀 Claim transaction sent:", tx.hash);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.transactionHash,
        message: "Reward claimed successfully!"
      };
    } catch (error) {
      console.error("❌ Error claiming referral reward:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to claim reward. Please try again."
      };
    }
  }

  /**
   * 📝 Setup referral codes (Admin function)
   * @param {Array} codes - Array of referral codes
   * @param {Array} firstRates - First level referral rates
   * @param {Array} secondFunds - Second level referral funds
   * @returns {Promise<Object>} Transaction result
   */
  async setupReferralCodes(codes, firstRates, secondFunds) {
    try {
      if (!this.signer) {
        throw new Error("Wallet not connected");
      }

      const tx = await this.contract.setupRefData(codes, firstRates, secondFunds);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.transactionHash,
        message: `${codes.length} referral codes setup successfully!`
      };
    } catch (error) {
      console.error("❌ Error setting up referral codes:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🎯 Generate and register invite code for user
   * @param {string} userAddress - User's wallet address
   * @param {string} referrerCode - Optional referrer code
   * @returns {Promise<Object>} Generated code and registration result
   */
  async generateInviteCode(userAddress, referrerCode = null) {
    try {
      if (!userAddress) {
        throw new Error("User address required");
      }

      // Generate deterministic code based on user address
      const timestamp = Date.now();
      const shortAddress = userAddress.slice(-8).toUpperCase();
      const code = `NODE-${shortAddress}-${timestamp.toString().slice(-6)}`;

      console.log(`🎯 Generated invite code: ${code} for ${userAddress}`);

      // Check if user can register codes (future enhancement for direct contract registration)
      if (this.signer) {
        try {
          const userSigner = await this.signer.getAddress();
          if (userSigner.toLowerCase() === userAddress.toLowerCase()) {
            // User can potentially register their own code
            // For now, we just generate the code locally
            console.log("✅ Code generated for current user");
          }
        } catch (e) {
          console.warn("⚠️ Could not verify signer:", e.message);
        }
      }

      return {
        success: true,
        code,
        method: "node-sol-local",
        message: "Invite code generated with Node.sol compatibility",
        registered: false, // Will be true when direct contract registration is implemented
        userAddress,
        referrerCode
      };

    } catch (error) {
      console.error("❌ Error generating invite code:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to generate invite code"
      };
    }
  }

  /**
   * 🔍 Check if invite code exists in contract
   * @param {string} code - Invite code to check
   * @returns {Promise<Object>} Code existence and details
   */
  async checkInviteCodeExists(code) {
    try {
      if (!this.contract) await this.initialize();

      // Try to get code rates (if they exist, code is registered)
      const [firstRate, secondRate] = await this.contract.getRefCodeRates(code);
      
      const exists = firstRate.gt(0) || secondRate.gt(0);
      
      return {
        exists,
        code,
        firstRate: firstRate.toString(),
        secondRate: secondRate.toString(),
        message: exists ? "Code found in contract" : "Code not registered yet"
      };
      
    } catch (error) {
      console.error("❌ Error checking invite code:", error);
      return {
        exists: false,
        code,
        error: error.message,
        message: "Could not verify code in contract"
      };
    }
  }

  /**
   * 🔗 Get connected wallet address
   * @returns {Promise<string|null>} Wallet address or null
   */
  async getConnectedWallet() {
    try {
      if (!this.signer) return null;
      return await this.signer.getAddress();
    } catch (error) {
      console.error("❌ Error getting connected wallet:", error);
      return null;
    }
  }

  /**
   * 🌐 Get contract info for debugging
   * @returns {Object} Contract connection info
   */
  getContractInfo() {
    return {
      contractAddress: NODE_CONTRACT_ADDRESS,
      bitsTokenAddress: BITS_TOKEN_ADDRESS,
      isConnected: this.isConnected,
      hasWallet: !!this.signer,
      provider: this.provider ? "Connected" : "Not connected"
    };
  }
}

// 🎯 Export singleton instance
const nodeRewardsService = new NodeRewardsService();

export default nodeRewardsService;

/**
 * 🔧 Helper functions for components
 */

/**
 * Format BITS amount with proper decimals
 */
export const formatBitsAmount = (amount, decimals = 4) => {
  const num = parseFloat(amount);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toFixed(decimals);
};

/**
 * Check if wallet is connected and on correct network
 */
export const validateWalletConnection = async () => {
  if (!window.ethereum) {
    return { valid: false, message: "Please install MetaMask" };
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    const accounts = await provider.listAccounts();

    if (accounts.length === 0) {
      return { valid: false, message: "Please connect your wallet" };
    }

    if (network.chainId !== 97) {
      return { 
        valid: false, 
        message: "Please switch to BSC Testnet (Chain ID: 97)" 
      };
    }

    return { 
      valid: true, 
      address: accounts[0],
      network: network.name 
    };
  } catch (error) {
    return { 
      valid: false, 
      message: "Wallet connection error: " + error.message 
    };
  }
};

/**
 * 📱 React Hook for using Node Rewards Service
 * 
 * Note: Import React in the component that uses this hook
 */
export const useNodeRewards = () => {
  // This will be used in React components that import React
  // Components should import: import React, { useState, useEffect } from "react";
  
  return {
    service: nodeRewardsService,
    contractInfo: nodeRewardsService.getContractInfo()
  };
};
