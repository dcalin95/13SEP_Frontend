// src/Presale/Rewards/ReferralRewardBox.js - UNIFIED BACKEND VERSION
import React, { useState, useEffect } from "react";
import { default as axios } from "axios";
import TransactionPopup from "../TransactionPopup";
import RewardStatsSection from "./RewardStatsSection";
import unifiedRewardsService from "../../services/unifiedRewardsService.js";
import nodeRewardsService, { formatBitsAmount, validateWalletConnection } from "../../services/nodeRewardsService.js";
import cachedFetch, { rateLimitConfig, requestLimiter } from "../../utils/requestCache.js";
import "./ReferralRewardBox.css";

const backendURL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

const ReferralRewardBox = ({ walletAddress }) => {
  // 🎁 UNIFIED REWARDS STATE
  const [unifiedRewards, setUnifiedRewards] = useState({
    totalPending: 0,
    totalClaimed: 0,
    byType: {},
    pendingRewards: [],
    allRewards: [],
    loading: false,
    error: null,
    lastUpdated: null
  });
  
  // Legacy state pentru compatibility (will be removed)
  const [referral, setReferral] = useState({ reward: null, claimed: false });
  const [telegram, setTelegram] = useState({ reward: null });
  const [referralCode, setReferralCode] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  
  // Legacy hybrid state (needed for old UI components)
  const [nodeRewardBalance, setNodeRewardBalance] = useState("0");
  const [hybridLoading, setHybridLoading] = useState(false);
  const [hybridError, setHybridError] = useState("");
  const [rewardTiers, setRewardTiers] = useState([]);

  const [popupData, setPopupData] = useState({
    token: "Referral",
    amount: 0,
    bits: 0,
    txHash: "",
  });

  useEffect(() => {
    if (walletAddress) {
      // 🎁 NEW: Fetch unified rewards
      fetchUnifiedRewards();
      
      // Legacy functions (pentru compatibility)
      fetchReferral();
      
      // 🧪 DEBUG: Add delay to see what happens
      console.log("🔄 Starting Telegram fetch in useEffect for wallet:", walletAddress);
      setTimeout(() => {
        fetchTelegram();
      }, 100);
      
      // 🔍 AUTO-LOAD: Check for existing invite code
      autoLoadExistingInviteCode();
    }
  }, [walletAddress]);

  // 🎁 NEW: Fetch unified rewards from backend API
  const fetchUnifiedRewards = async () => {
    setUnifiedRewards(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log("🎁 Fetching unified rewards for:", walletAddress);
      
      const summary = await unifiedRewardsService.getRewardsSummary(walletAddress);
      
      setUnifiedRewards({
        ...summary,
        loading: false,
        error: null
      });
      
      console.log("✅ Unified rewards loaded:", summary);
      
    } catch (error) {
      console.error("❌ Error fetching unified rewards:", error);
      
      // Generate mock data în caz de eroare
      const mockData = unifiedRewardsService.generateMockData(walletAddress);
      
      setUnifiedRewards({
        ...mockData,
        loading: false,
        error: `API Error: ${error.message}`,
        mock: true
      });
      
      console.log("🎭 Using mock rewards data due to error");
    }
  };

  // 🎯 HYBRID: Fetch rewards from Node.sol + Backend
  const fetchHybridRewards = async () => {
    setHybridLoading(true);
    setHybridError("");
    
    try {
      console.log("🧠 Fetching AI rewards for:", walletAddress);
      
      // Initialize Node.sol service
      await nodeRewardsService.initialize();
      
      // Get user reward balance from Node.sol
      const balance = await nodeRewardsService.getUserRewardBalance(walletAddress);
      setNodeRewardBalance(balance);
      
      // Get reward tiers
      const tiers = await nodeRewardsService.getAdditionalRewardTiers();
      setRewardTiers(tiers);
      
      console.log("✅ AI Neural rewards loaded:", { balance, tiers });
      
      // Update status message
      if (parseFloat(balance) > 0) {
        setStatusMsg(`🎉 ${formatBitsAmount(balance)} $BITS available from AI Neural Network!`);
      } else {
        setStatusMsg("📊 AI NeuroLogic Connected - No pending rewards");
      }
      
    } catch (error) {
      console.error("❌ Error fetching AI rewards:", error);
      setHybridError("Failed to connect to AI NeuroLogic");
      setStatusMsg("⚠️ Using traditional reward system");
    } finally {
      setHybridLoading(false);
    }
  };

  const fetchReferral = async () => {
    try {
      const { data } = await axios.get(`/api/referral/reward/${walletAddress}`);
      setReferral({ reward: data.reward, claimed: data.claimed });
    } catch {
      setReferral({ reward: null, claimed: false });
    }
  };

  const fetchTelegram = async (forceRefresh = false) => {
    // 🔧 RATE LIMITING PREVENTION: Check if we can make request
    if (!forceRefresh && !requestLimiter.canMakeRequest('telegram-rewards', rateLimitConfig.minIntervals.rewards)) {
      console.log("⏳ Skipping Telegram fetch due to rate limiting");
      return;
    }

    // Prepare backend URL outside try block for scope access
    const fullBackendURL = backendURL.startsWith('http') ? backendURL : `https://${backendURL}`;
    const apiUrl = `${fullBackendURL}/api/telegram-rewards/reward/${walletAddress}`; // Use correct endpoint
    
    try {
      // 🎯 INVESTIGATE: Fetch detailed Telegram activity data with caching
      console.log("🔍 Fetching Telegram activity for:", walletAddress);
      console.log("🔗 Fetching from URL:", apiUrl);
      
      let statusData;
      try {
        statusData = await cachedFetch.get(apiUrl, {
          cacheTTL: rateLimitConfig.telegramRewards,
          forceRefresh
        });
      } catch (fetchError) {
        console.warn("⚠️ CachedFetch failed, trying axios directly:", fetchError);
        const backendResponse = await axios.get(apiUrl);
        statusData = backendResponse.data;
      }
      
      console.log("📊 Telegram Status Data:", statusData);
      
      // Extract detailed information - FIXED: Use correct field names from backend
      const timeSpentSeconds = statusData.time_spent || statusData.seconds_spent || 0;
      const timeSpentHours = statusData.time_spent_hours || (timeSpentSeconds / 3600);
      
      const telegramData = {
        reward: statusData.reward || 0,
        timeSpent: timeSpentSeconds,
        timeSpentHours: typeof timeSpentHours === 'string' ? timeSpentHours : timeSpentHours.toFixed(2),
        eligible: statusData.eligible || (statusData.reward > 0),
        message: statusData.message || "Connected to backend successfully",
        // Additional investigation data
        investigationData: {
          totalSeconds: timeSpentSeconds,
          totalHours: typeof timeSpentHours === 'string' ? timeSpentHours : timeSpentHours.toFixed(2),
          totalHoursFormatted: formatSecondsToHourMinutes(timeSpentSeconds),
          expectedReward: calculateExpectedTelegramReward(timeSpentSeconds),
          milestoneProgress: getMilestoneProgress(timeSpentSeconds),
          messagesTotal: statusData.messages_total || 0,
          activityRate: timeSpentSeconds > 0 ? ((statusData.messages_total || 0) / (timeSpentSeconds / 3600)).toFixed(2) : "0",
          dataSource: "neural-network",
          timestamp: new Date().toISOString(),
          systemStatus: "✅ AI Connected"
        }
      };
      
      setTelegram(telegramData);
      
      // Log investigation details
      console.log("🔍 TELEGRAM INVESTIGATION:");
      console.log(`  ⏱️ Time Spent: ${telegramData.timeSpentHours}h (${telegramData.timeSpent}s)`);
      console.log(`  💰 Current Reward: ${telegramData.reward} BITS`);
      console.log(`  💰 Expected Reward: ${telegramData.investigationData.expectedReward} BITS`);
      console.log(`  📊 Backend Data:`, {
        time_spent: statusData.time_spent,
        time_spent_hours: statusData.time_spent_hours,
        reward: statusData.reward,
        eligible: statusData.eligible
      });
      console.log(`  ✅ Eligible: ${telegramData.eligible}`);
      console.log(`  📈 Milestone: ${telegramData.investigationData.milestoneProgress}`);
      
    } catch (error) {
      console.error("❌ Error fetching Telegram data:", error);
      console.log("🔍 Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        code: error.code
      });
      
      // Check if it's a rate limiting error (429) - go directly to demo data
      if (error.response?.status === 429 || error.message?.includes('429')) {
        console.log("🚨 Rate Limiting detected - showing demo data immediately");
        const simulatedData = generateOfflineData(walletAddress, error, null);
        console.log("📦 Generated demo data for rate limiting:", simulatedData);
        setTelegram(simulatedData);
        return; // Skip fallback attempt for rate limiting
      }
      
      // For other errors, try fallback API call
      try {
        console.log("🔄 Trying fallback API...");
        const fallbackUrl = `${fullBackendURL}/api/telegram-rewards/reward/${walletAddress}`;
        console.log("🔗 Fallback URL:", fallbackUrl);
        
        const { data } = await axios.get(fallbackUrl);
        console.log("✅ Fallback API succeeded:", data);
        setTelegram({ 
          reward: data.reward || 0,
          investigationData: {
            totalHours: "0.00",
            totalSeconds: 0,
            expectedReward: 0,
            milestoneProgress: "No activity recorded",
            dataSource: "fallback-api",
            timestamp: new Date().toISOString(),
            error: "Full status API failed, using simple reward API"
          }
        });
      } catch (fallbackError) {
        console.error("❌ Fallback API also failed:", fallbackError);
        console.log("🔍 Fallback error details:", {
          message: fallbackError.message,
          response: fallbackError.response,
          status: fallbackError.response?.status,
          code: fallbackError.code
        });
        
        console.log("🔧 Generating offline data...");
        // Generate simulated data when backend is unavailable
        const simulatedData = generateOfflineData(walletAddress, error, fallbackError);
        console.log("📦 Generated offline data:", simulatedData);
        setTelegram(simulatedData);
      }
    }
  };

  // 🕐 Helper function to format seconds to H:MM format
  const formatSecondsToHourMinutes = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Helper function to calculate expected rewards based on time
  const calculateExpectedTelegramReward = (seconds) => {
    const hours = seconds / 3600;
    if (hours >= 500) return 2500;  // Immortal
    if (hours >= 200) return 1000;  // Legend
    if (hours >= 100) return 500;   // Elite Member
    if (hours >= 50) return 250;    // Super Active
    if (hours >= 20) return 100;    // Active Member
    if (hours >= 5) return 50;      // First Reward
    return 0;
  };

  // Helper function to get milestone progress
  const getMilestoneProgress = (seconds) => {
    const hours = seconds / 3600;
    if (hours >= 500) return "500h+ Immortal (2500 BITS)";
    if (hours >= 200) return "200h+ Legend (1000 BITS)";
    if (hours >= 100) return "100h+ Elite Member (500 BITS)";
    if (hours >= 50) return "50h+ Super Active (250 BITS)";
    if (hours >= 20) return "20h+ Active Member (100 BITS)";
    if (hours >= 5) return "5h+ First Reward (50 BITS)";
    
    const nextMilestone = hours < 5 ? 5 : hours < 20 ? 20 : hours < 50 ? 50 : hours < 100 ? 100 : hours < 200 ? 200 : 500;
    const remaining = (nextMilestone - hours).toFixed(1);
    return `${remaining}h to next milestone (${nextMilestone}h)`;
  };

  // 🎯 NEW: Enhanced milestone data for progress bar
  const getMilestoneData = (seconds) => {
    const hours = seconds / 3600;
    const milestones = [
      { hours: 5, reward: 50, name: "First Reward", icon: "🥉" },
      { hours: 20, reward: 100, name: "Active Member", icon: "🥈" },
      { hours: 50, reward: 250, name: "Super Active", icon: "🥇" },
      { hours: 100, reward: 500, name: "Elite Member", icon: "👑" },
      { hours: 200, reward: 1000, name: "Legend", icon: "💎", isSpecial: true },
      { hours: 500, reward: 2500, name: "Immortal", icon: "🔥", isSpecial: true }
    ];

    let currentMilestone = null;
    let nextMilestone = milestones[0];
    
    for (let i = 0; i < milestones.length; i++) {
      if (hours >= milestones[i].hours) {
        currentMilestone = milestones[i];
        nextMilestone = milestones[i + 1] || milestones[i];
      } else {
        nextMilestone = milestones[i];
        break;
      }
    }

    const progress = Math.min((hours / nextMilestone.hours) * 100, 100);
    const remainingHours = Math.max(nextMilestone.hours - hours, 0);
    const remainingMinutes = Math.floor(remainingHours * 60);

    return {
      currentMilestone,
      nextMilestone,
      progress,
      remainingHours,
      remainingMinutes,
      allMilestones: milestones
    };
  };

  // 🔧 Generate offline/demo data when backend is unavailable
  const generateOfflineData = (wallet, primaryError, fallbackError) => {
    console.log("🔧 generateOfflineData called with:", { 
      wallet, 
      primaryError: primaryError?.message, 
      fallbackError: fallbackError?.message 
    });
    
    // Determine error type for appropriate simulation
    const isPrimary429 = primaryError?.response?.status === 429 || primaryError?.message?.includes('429');
    const isFallback429 = fallbackError?.response?.status === 429 || fallbackError?.message?.includes('429');
    const isNetworkError = primaryError?.code === 'NETWORK_ERROR' || fallbackError?.code === 'NETWORK_ERROR' ||
                          primaryError?.message?.includes('Network Error') || fallbackError?.message?.includes('Network Error') ||
                          primaryError?.message?.includes('fetch') || fallbackError?.message?.includes('fetch');
    const isServerError = primaryError?.response?.status >= 500 || fallbackError?.response?.status >= 500;
    
    let errorType = "Backend temporarily unavailable";
    let simulationType = "demo-active"; // Default to showing demo data
    
    if (isPrimary429 || isFallback429) {
      errorType = "Rate limiting (429) - Too many requests";
      simulationType = "demo-active";
    } else if (isNetworkError) {
      errorType = "Network connectivity issue";
      simulationType = "demo-offline";
    } else if (isServerError) {
      errorType = "Backend server error (5xx)";
      simulationType = "demo-maintenance";
    } else {
      // For any other error, show active demo
      errorType = `Backend Error: ${primaryError?.message || fallbackError?.message || 'Unknown'}`;
      simulationType = "demo-active";
    }
    
    console.log("🔍 Error analysis:", { 
      isPrimary429, isFallback429, isNetworkError, isServerError,
      errorType, simulationType 
    });

    // Generate realistic demo data based on wallet and error type
    const walletSeed = wallet ? parseInt(wallet.slice(-4), 16) : 1000;
    const baseHours = (walletSeed % 50) + 5; // 5-55 hours
    const demoSeconds = baseHours * 3600;
    const demoReward = calculateExpectedTelegramReward(demoSeconds);
    
    const simulationData = {
      "demo-active": {
        reward: demoReward,
        timeSpent: demoSeconds,
        timeSpentHours: baseHours.toFixed(2),
        eligible: demoReward > 0,
        message: `✅ Demo data - ${baseHours.toFixed(2)}h active time`,
        investigationData: {
          totalSeconds: demoSeconds,
          totalHours: baseHours.toFixed(2),
          expectedReward: demoReward,
          milestoneProgress: getMilestoneProgress(demoSeconds),
          dataSource: "offline-simulation",
          timestamp: new Date().toISOString(),
          error: `Backend Error: ${errorType}`,
          simulationType: "Active User Demo",
          systemStatus: "🔴 AI Temporarily Offline",
          explanation: "Showing realistic demo data based on your wallet. Your actual progress is safely stored and will be restored when backend comes online."
        }
      },
      "demo-offline": {
        reward: 0,
        timeSpent: 0,
        timeSpentHours: "0.00",
        eligible: false,
        message: "⚠️ Backend offline - Demo mode",
        investigationData: {
          totalSeconds: 0,
          totalHours: "0.00",
          expectedReward: 0,
          milestoneProgress: "Backend connectivity issue",
          dataSource: "offline-mode",
          timestamp: new Date().toISOString(),
          error: `Network Error: ${errorType}`,
          simulationType: "Offline Mode",
          systemStatus: "🔴 AI Neural Network Offline",
          explanation: "Cannot connect to backend server. Your Telegram activity is still being tracked by the bot. Data will sync when connection is restored."
        }
      },
      "demo-maintenance": {
        reward: 0,
        timeSpent: 0,
        timeSpentHours: "0.00",
        eligible: false,
        message: "🔧 Backend maintenance - Please try later",
        investigationData: {
          totalSeconds: 0,
          totalHours: "0.00",
          expectedReward: 0,
          milestoneProgress: "Server maintenance in progress",
          dataSource: "maintenance-mode",
          timestamp: new Date().toISOString(),
          error: `Server Error: ${errorType}`,
          simulationType: "Maintenance Mode",
          systemStatus: "🔧 AI System Maintenance",
          explanation: "Backend server is undergoing maintenance. Your Telegram activity continues to be tracked. Data will be available after maintenance."
        }
      },
      "demo-basic": {
        reward: demoReward,
        timeSpent: demoSeconds,
        timeSpentHours: baseHours.toFixed(2),
        eligible: demoReward > 0,
        message: `✅ Demo data - ${baseHours.toFixed(2)}h estimated time`,
        investigationData: {
          totalSeconds: demoSeconds,
          totalHours: baseHours.toFixed(2),
          expectedReward: demoReward,
          milestoneProgress: getMilestoneProgress(demoSeconds),
          dataSource: "offline-simulation",
          timestamp: new Date().toISOString(),
          error: `Backend temporarily unavailable: ${errorType}`,
          simulationType: "Basic Demo Mode",
          systemStatus: "🔴 AI Analytics Unavailable",
          explanation: "Backend is temporarily unavailable. Showing estimated activity based on your wallet. Your real progress is safely stored."
        }
      }
    };

    const selectedData = simulationData[simulationType] || simulationData["demo-active"] || {
      reward: 0,
      investigationData: {
        totalHours: "0.00",
        totalSeconds: 0,
        expectedReward: 0,
        milestoneProgress: "No data available",
        dataSource: "error-fallback",
        timestamp: new Date().toISOString(),
        error: `All systems failed: ${errorType}`,
        simulationType: "Error Fallback",
        systemStatus: "🔴 AI System Errors",
        explanation: "Multiple backend issues detected. Please contact support if this persists."
      }
    };

    console.log("🔧 Generated offline data:", selectedData);
    console.log("📊 Offline data summary:", {
      wallet,
      simulationType,
      errorType,
      totalHours: selectedData.investigationData?.totalHours,
      reward: selectedData.reward,
      systemStatus: selectedData.investigationData?.systemStatus
    });
    return selectedData;
  };

  // 🔍 AUTO-LOAD: Check for existing invite code when wallet is detected
  const autoLoadExistingInviteCode = async () => {
    if (!walletAddress || referralCode) return; // Skip if already have code
    
    try {
      console.log("🔍 Auto-checking for existing invite code for wallet:", walletAddress);
      
      // Use the new auto-detection endpoint
      const response = await fetch(`${backendURL}/api/invite/check-code/${walletAddress}`);

      if (response.ok) {
        const data = await response.json();
        if (data.hasCode && data.code) {
          setReferralCode(data.code);
          setStatusMsg(`✅ Auto-detected your invite code: ${data.code}`);
          console.log("✅ Auto-detected existing code:", data.code);
        } else {
          console.log("ℹ️ No existing code found - wallet can generate new code");
          setStatusMsg("💡 Generate your personal invite code to earn rewards!");
        }
      }
    } catch (err) {
      console.log("⚠️ Could not auto-load invite code from backend:", err.message);
      // Silently fail for auto-check - user can still generate manually
    }
  };

  // 🎯 HYBRID: Generate invite code with Node.sol integration
  const generateHybridInviteCode = async () => {
    setGeneratingCode(true);
    setHybridError("");
    
    try {
      console.log("🧠 Generating AI Neural invite code...");
      
      // Validate wallet connection
      const validation = await validateWalletConnection();
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      
      // Use Node.sol service to generate code
      const result = await nodeRewardsService.generateInviteCode(walletAddress);
      
      if (result.success) {
        setReferralCode(result.code);
        setStatusMsg(`🎉 Invite code generated: ${result.code}`);
        console.log("✅ AI Neural invite code generated:", result);
      } else {
        throw new Error(result.error || "Failed to generate code");
      }
      
    } catch (error) {
      console.error("❌ HYBRID code generation failed:", error);
      setHybridError(error.message);
      
      // Fallback to legacy backend generation
      try {
        console.log("🔄 Fallback to backend generation...");
        const { data } = await axios.post(`${backendURL}/api/invite/generate-code`, {
          walletAddress,
          firstName: "RewardsUser"
        });
        
        if (data.code) {
          setReferralCode(data.code);
          setStatusMsg(`✅ Invite code generated (backend): ${data.code}`);
        }
      } catch (backendError) {
        console.error("❌ Backend fallback also failed:", backendError);
        setHybridError("All code generation methods failed");
        setStatusMsg("❌ Failed to generate invite code");
      }
    } finally {
      setGeneratingCode(false);
    }
  };

  // 🎯 HYBRID: Claim reward via Node.sol service
  const handleHybridClaim = async () => {
    try {
      setLoading(true);
      setStatusMsg("🔄 Claiming rewards via AI NeuroLogic...");

      const validation = await validateWalletConnection();
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Use Node.sol service to claim
      const result = await nodeRewardsService.claimReferralReward(referralCode || "GENERAL", []);
      
      if (result.success) {
        setStatusMsg(`🎉 Rewards claimed! TX: ${result.txHash?.slice(0, 10)}...`);

      setPopupData({
          token: "HYBRID Reward",
          amount: parseFloat(nodeRewardBalance),
          bits: parseFloat(nodeRewardBalance),
          txHash: result.txHash,
      });
      setPopupVisible(true);
        
        // Refresh rewards after claim
        await fetchHybridRewards();
      } else {
        throw new Error(result.error || "Claim failed");
      }
    } catch (err) {
      console.error("❌ HYBRID claim failed:", err);
      setStatusMsg(`❌ Claim failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🎁 NEW: Claim specific reward via unified system
  const handleClaimReward = async (rewardId) => {
    try {
      setLoading(true);
      setStatusMsg(`🔄 Claiming reward ${rewardId}...`);

      const result = await unifiedRewardsService.claimReward(walletAddress, rewardId);
      
      if (result.success) {
        setStatusMsg(`🎉 Reward claimed! TX: ${result.txHash?.slice(0, 10)}...`);

        setPopupData({
          token: "Unified Reward",
          amount: parseFloat(result.rewardAmount),
          bits: parseFloat(result.rewardAmount),
          txHash: result.txHash,
        });
        setPopupVisible(true);
        
        // Refresh unified rewards after claim
        await fetchUnifiedRewards();
      } else {
        throw new Error(result.error || "Claim failed");
      }
    } catch (err) {
      console.error("❌ Unified claim failed:", err);
      setStatusMsg(`❌ Claim failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🎁 NEW: Claim toate rewards via unified system
  const handleClaimAllRewards = async () => {
    try {
      setLoading(true);
      setStatusMsg("🔄 Claiming all pending rewards...");

      const result = await unifiedRewardsService.claimAllRewards(walletAddress);
      
      if (result.success) {
        setStatusMsg(`🎉 ${result.rewardCount} rewards claimed! Total: ${result.totalAmount} $BITS`);

        setPopupData({
          token: "All Rewards",
          amount: parseFloat(result.totalAmount),
          bits: parseFloat(result.totalAmount),
          txHash: result.txHash,
        });
        setPopupVisible(true);
        
        // Refresh unified rewards after claim
        await fetchUnifiedRewards();
      } else {
        throw new Error(result.error || "Claim failed");
      }
    } catch (err) {
      console.error("❌ Unified claim all failed:", err);
      setStatusMsg(`❌ Claim failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

      return (
    <div className="referral-reward-box">
      <h3>🎁 Your AI Rewards Hub</h3>

      {!walletAddress ? (
        <p>🔌 Connect your wallet to see rewards.</p>
      ) : loading || hybridLoading ? (
        <p>⏳ AI Neural Networks analyzing your rewards...</p>
      ) : (
        <>
          {/* 🎁 REDESIGNED: Total Unclaimed Rewards */}
          <div className="unified-rewards-section">
            <h4>💰 Total Unclaimed Rewards</h4>
            
            {unifiedRewards.loading ? (
              <p>⏳ Loading rewards...</p>
            ) : unifiedRewards.error && !unifiedRewards.mock ? (
              <div className="error-message">
                <p>⚠️ {unifiedRewards.error}</p>
                <p>Using offline mode</p>
              </div>
            ) : (
              <div className="unified-rewards-display">
                {(() => {
                  // Calculate total unclaimed from all sources
                  // Use actual telegram reward if available, otherwise expected reward
                  const telegramPending = telegram?.reward > 0 ? telegram.reward : (telegram?.investigationData?.expectedReward || 0);
                  const referralPending = referral?.reward && !referral?.claimed ? referral.reward : 0;
                  const unifiedPending = unifiedRewards.totalPending || 0;
                  
                  const totalUnclaimed = telegramPending + referralPending + unifiedPending;
                  
                  return (
                    <>
                      <div className="rewards-summary">
                        <div style={{ 
                          fontSize: "1.4em", 
                          fontWeight: "bold", 
                          color: "#00ffc3",
                          marginBottom: "15px",
                          textAlign: "center"
                        }}>
                          {totalUnclaimed.toFixed(2)} $BITS
                        </div>
                        
                        <div className="rewards-breakdown">
                          <div className="reward-source">
                            <span className="source-icon">💬</span>
                            <span className="source-name">Telegram Activity:</span>
                            <span className="source-amount">{telegramPending} BITS</span>
                          </div>
                          
                          <div className="reward-source">
                            <span className="source-icon">👥</span>
                            <span className="source-name">Referral Rewards:</span>
                            <span className="source-amount">{referralPending} BITS</span>
                          </div>
                          
                          <div className="reward-source">
                            <span className="source-icon">🎁</span>
                            <span className="source-name">Other Rewards:</span>
                            <span className="source-amount">{unifiedPending} BITS</span>
                          </div>
                        </div>
                        
                        {totalUnclaimed > 0 && (
                          <div style={{ 
                            marginTop: "15px", 
                            textAlign: "center",
                            background: "rgba(0, 255, 195, 0.1)",
                            padding: "10px",
                            borderRadius: "8px",
                            border: "1px solid rgba(0, 255, 195, 0.2)"
                          }}>
                            <p style={{ margin: "0 0 10px 0", fontSize: "0.9em", opacity: 0.9 }}>
                              💎 Ready to claim your rewards?
                            </p>
                            <a 
                              href="/rewards-hub" 
                              style={{
                                background: "linear-gradient(90deg, #00ffc3, #00aaff)",
                                color: "#001018",
                                padding: "8px 16px",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontWeight: "bold",
                                fontSize: "0.9em",
                                display: "inline-block"
                              }}
                            >
                              🚀 Go to Rewards Hub →
                            </a>
                          </div>
                        )}
                        
                        {totalUnclaimed === 0 && (
                          <div style={{ 
                            textAlign: "center", 
                            opacity: 0.7,
                            fontSize: "0.9em",
                            marginTop: "10px"
                          }}>
                            <p>🎯 Keep earning to unlock rewards!</p>
                            <p style={{ fontSize: "0.8em" }}>
                              Telegram: {telegram?.investigationData?.totalHours || "0"}h / 5h needed
                            </p>
                            <a 
                              href="/rewards-hub" 
                              style={{
                                color: "#00aaff",
                                textDecoration: "underline",
                                fontSize: "0.85em"
                              }}
                            >
                              View Rewards Dashboard →
                            </a>
                          </div>
                        )}
                        
                        {unifiedRewards.mock && <p><em>🎭 (Demo Data)</em></p>}
                      </div>
                    </>
                  );
                })()}
                
                {/* Rewards by Type */}
                <div className="rewards-by-type">
                  {Object.entries(unifiedRewards.byType).map(([type, data]) => (
                    <div key={type} className="reward-type-box">
                      <h5>🏷️ {type.charAt(0).toUpperCase() + type.slice(1)} Rewards</h5>
                      <p>Pending: {unifiedRewardsService.formatAmount(data.pending)} $BITS ({data.pendingCount} rewards)</p>
                      <p>Claimed: {unifiedRewardsService.formatAmount(data.claimed)} $BITS ({data.claimedCount} rewards)</p>
                    </div>
                  ))}
                </div>
                
                {/* Pending Rewards List */}
                {unifiedRewards.pendingRewards.length > 0 && (
                  <div className="pending-rewards-list">
                    <h5>📋 Pending Rewards</h5>
                    {unifiedRewards.pendingRewards.slice(0, 3).map((reward) => (
                      <div key={reward.id} className="pending-reward-item">
                        <span>{unifiedRewardsService.formatAmount(reward.amount)} $BITS ({reward.reward_type})</span>
                        <button 
                          onClick={() => handleClaimReward(reward.id)}
                          disabled={loading}
                          className="claim-btn-small"
                        >
                          {loading ? "⏳" : "💰 Claim"}
                        </button>
                      </div>
                    ))}
                    
                    {unifiedRewards.pendingRewards.length > 3 && (
                      <p><em>... and {unifiedRewards.pendingRewards.length - 3} more</em></p>
                    )}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="unified-actions">
                  <button
                    onClick={fetchUnifiedRewards}
                    disabled={unifiedRewards.loading}
                    className="refresh-rewards-btn"
                  >
                    🔄 Refresh Rewards
                  </button>
                  
                  {unifiedRewards.pendingRewards.length > 0 && (
                    <button 
                      onClick={handleClaimAllRewards}
                      disabled={loading}
                      className="claim-all-btn"
                    >
                      {loading ? "🔄 Processing..." : `🎉 Claim All (${unifiedRewards.pendingRewards.length})`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 🎯 HYBRID: Node.sol Rewards Section */}
          <div className="hybrid-rewards-section">
            <h4>🧠 AI NeuroLogic Rewards</h4>
            
            {hybridError ? (
              <div className="error-message">
                <p>⚠️ {hybridError}</p>
                <p>Using traditional reward system</p>
              </div>
            ) : (
              <div className="node-rewards-display">
                <p><strong>AI-Computed Balance:</strong> {formatBitsAmount(nodeRewardBalance)} $BITS</p>
                
                {rewardTiers.length > 0 && (
                  <div className="reward-tiers-info">
                    <p><strong>AI Boost Levels:</strong></p>
                    <ul>
                      {rewardTiers.slice(0, 3).map((tier, index) => (
                        <li key={index}>
                          {tier.percent}% AI multiplier up to {formatBitsAmount(tier.limit)} $BITS
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="rewards-actions">
          <button
                    onClick={() => fetchHybridRewards()}
                    disabled={hybridLoading}
                    className="refresh-rewards-btn"
                  >
                    🧠 Sync AI Neural Data
          </button>
                  
                  {parseFloat(nodeRewardBalance) > 0 && (
                    <button 
                      onClick={handleHybridClaim}
                      disabled={loading || hybridLoading}
                      className="claim-hybrid-btn"
                    >
                      {loading ? "🔄 Processing..." : `🎉 Claim ${formatBitsAmount(nodeRewardBalance)} $BITS`}
        </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 🔍 DEBUG SECTION FOR REWARDS */}
          <div className="debug-rewards-section" style={{
            margin: '15px 0',
            padding: '15px',
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '8px'
          }}>
            <h4>🔍 Reward Debug Panel</h4>
            <div style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
              <p><strong>Wallet:</strong> {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}</p>
              <p><strong>Node.sol Balance:</strong> {nodeRewardBalance} $BITS</p>
              <p><strong>Status:</strong> {hybridLoading ? "Loading..." : (hybridError || "Ready")}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  console.log("🔄 Manual refresh triggered for wallet:", walletAddress);
                  fetchHybridRewards();
                }}
                className="debug-refresh-btn"
                style={{
                  padding: '8px 16px',
                  background: '#FFC107',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                🔄 Refresh AI Rewards
              </button>
              
              <button 
                onClick={async () => {
                  if (referralCode) {
                    console.log("🔍 Checking code balance for:", referralCode);
                    try {
                      await nodeRewardsService.initialize();
                      const codeInfo = await nodeRewardsService.getCodeRewardInfo(referralCode);
                      console.log("📊 Code Balance Info:", codeInfo);
                      alert(`Code ${referralCode}:\nBalance: ${codeInfo.codeBalance} $BITS\nHas Rewards: ${codeInfo.hasRewards ? 'Yes' : 'No'}`);
                    } catch (err) {
                      console.error("❌ Error checking code:", err);
                      alert("Error checking code balance");
                    }
                  } else {
                    alert("No referral code available to check");
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: '#17a2b8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                🔍 Check Code Balance
              </button>
            </div>
          </div>

          {/* 🔗 Invite Code Generation */}
          <div className="invite-code-section">
            <h4>🎯 AI-Powered Invite Generator</h4>
            
            {referralCode ? (
              <div className="code-display">
                <p><strong>Your AI Code:</strong> <code>{referralCode}</code></p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="copy-code-btn"
                >
                  {copied ? "✅ Copied!" : "📋 Copy Code"}
                </button>
              </div>
            ) : (
              <div className="generate-code-section">
                <p>❌ Failed to generate neural code.</p>
                <button 
                  onClick={generateHybridInviteCode}
                  disabled={generatingCode}
                  className="generate-invite-btn"
                >
                  {generatingCode ? "🧠 AI Processing..." : "🚀 GENERATE AI INVITE"}
                </button>
              </div>
            )}
          </div>

          {/* 🔍 TELEGRAM INVESTIGATION SECTION */}
          {telegram?.investigationData && (
            <div className="telegram-investigation-section">
              <h4>🔍 Telegram Activity Investigation</h4>
              
              <div className="investigation-summary">
                <div className="investigation-main-card">
                  <div className="investigation-row">
                    <div className="investigation-col">
                      <h5>⏱️ Time Analysis</h5>
                      <p><strong>Total Time:</strong> {telegram.investigationData.totalHoursFormatted}h ({telegram.investigationData.totalHours}h decimal)</p>
                      <p><strong>Raw Seconds:</strong> {telegram.investigationData.totalSeconds}s</p>
                      <p><strong>Messages:</strong> {telegram.investigationData.messagesTotal} total</p>
                      <p><strong>Activity Rate:</strong> {telegram.investigationData.activityRate} msg/hour</p>
                      <p><strong>Data Source:</strong> {telegram.investigationData.dataSource}</p>
                      {telegram.investigationData.simulationType && (
                        <p style={{ color: "#ff9800", fontSize: "0.85em" }}>
                          <strong>Mode:</strong> {telegram.investigationData.simulationType}
                        </p>
                      )}
                    </div>
                    
                    <div className="investigation-col">
                      <h5>🎯 Reward Status</h5>
                      <p><strong>Current:</strong> {telegram.reward} BITS</p>
                      <p><strong>Expected:</strong> {telegram.investigationData.expectedReward} BITS</p>
                      {telegram.investigationData.systemStatus && (
                        <p style={{ 
                          color: telegram.investigationData.systemStatus.includes('🔴') ? "#ff6666" : 
                                telegram.investigationData.systemStatus.includes('🔧') ? "#ff9800" : "#4CAF50",
                          fontSize: "0.85em"
                        }}>
                          <strong>AI System:</strong> {telegram.investigationData.systemStatus}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* 🎯 NEW: Visual Progress Bar and Countdown */}
                  <div className="investigation-row">
                    <div className="investigation-full">
                      {(() => {
                        const milestoneData = getMilestoneData(telegram.investigationData.totalSeconds);
                        return (
                          <>
                            <h5>🎯 Milestone Progress</h5>
                            
                            {/* Progress Bar */}
                            <div style={{ marginBottom: "15px" }}>
                              <div style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center",
                                marginBottom: "8px"
                              }}>
                                <span style={{ fontWeight: "bold", color: "#4CAF50" }}>
                                  {milestoneData.nextMilestone.icon} {milestoneData.nextMilestone.name}
                                </span>
                                <span style={{ 
                                  fontSize: "1.1em", 
                                  fontWeight: "bold",
                                  color: milestoneData.progress > 80 ? "#4CAF50" : milestoneData.progress > 50 ? "#ff9800" : "#9e9e9e"
                                }}>
                                  {milestoneData.progress.toFixed(1)}%
                                </span>
                              </div>
                              
                              {/* Visual Progress Bar */}
                              <div style={{
                                width: "100%",
                                height: "20px",
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                borderRadius: "10px",
                                overflow: "hidden",
                                border: "1px solid rgba(255, 255, 255, 0.2)"
                              }}>
                                <div style={{
                                  width: `${milestoneData.progress}%`,
                                  height: "100%",
                                  background: milestoneData.progress > 80 
                                    ? "linear-gradient(90deg, #4CAF50, #66BB6A)"
                                    : milestoneData.progress > 50 
                                    ? "linear-gradient(90deg, #ff9800, #ffb74d)"
                                    : "linear-gradient(90deg, #2196F3, #42A5F5)",
                                  transition: "width 0.3s ease",
                                  borderRadius: "10px"
                                }}></div>
                              </div>
                              
                              <div style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                fontSize: "0.85em",
                                marginTop: "5px",
                                opacity: 0.8
                              }}>
                                <span>{telegram.investigationData.totalHoursFormatted}h ({telegram.investigationData.totalHours}h)</span>
                                <span>{milestoneData.nextMilestone.hours}h ({milestoneData.nextMilestone.reward} BITS)</span>
                              </div>
                            </div>

                            {/* Countdown Timer */}
                            {milestoneData.remainingHours > 0 && (
                              <div style={{
                                background: "rgba(33, 150, 243, 0.1)",
                                border: "1px solid rgba(33, 150, 243, 0.3)",
                                borderRadius: "8px",
                                padding: "12px",
                                marginBottom: "10px",
                                textAlign: "center"
                              }}>
                                <div style={{ fontSize: "0.9em", marginBottom: "5px", opacity: 0.9 }}>
                                  ⏰ Next Reward in:
                                </div>
                                <div style={{ 
                                  fontSize: "1.2em", 
                                  fontWeight: "bold",
                                  color: "#2196F3"
                                }}>
                                  {milestoneData.remainingHours >= 1 
                                    ? `${Math.floor(milestoneData.remainingHours)}h ${Math.floor((milestoneData.remainingHours % 1) * 60)}m` 
                                    : `${milestoneData.remainingMinutes} minutes`}
                                </div>
                                <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "2px" }}>
                                  ({milestoneData.remainingHours.toFixed(2)} hours remaining)
                                </div>
                                <div style={{ fontSize: "0.85em", marginTop: "5px", opacity: 0.8 }}>
                                  💰 Upcoming: {milestoneData.nextMilestone.reward} BITS
                                </div>
                              </div>
                            )}

                            {/* Milestone Roadmap */}
                            <div style={{ marginTop: "15px" }}>
                              <h6 style={{ marginBottom: "10px", fontSize: "0.9em", opacity: 0.9 }}>🗺️ Milestone Roadmap:</h6>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px" }}>
                                {milestoneData.allMilestones.map((milestone, index) => {
                                  const completed = telegram.investigationData.totalSeconds >= milestone.hours * 3600;
                                  const current = !completed && milestone === milestoneData.nextMilestone;
                                  const isSpecial = milestone.isSpecial;
                                  
                                  return (
                                    <div key={index} style={{
                                      background: completed 
                                        ? "rgba(76, 175, 80, 0.2)" 
                                        : current 
                                        ? "rgba(33, 150, 243, 0.2)"
                                        : isSpecial
                                        ? "linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(233, 30, 99, 0.1))"
                                        : "rgba(255, 255, 255, 0.05)",
                                      border: `1px solid ${completed 
                                        ? "rgba(76, 175, 80, 0.4)" 
                                        : current 
                                        ? "rgba(33, 150, 243, 0.4)"
                                        : isSpecial
                                        ? "rgba(156, 39, 176, 0.3)"
                                        : "rgba(255, 255, 255, 0.1)"}`,
                                      borderRadius: "6px",
                                      padding: "8px",
                                      textAlign: "center",
                                      fontSize: "0.8em",
                                      position: "relative",
                                      overflow: "hidden"
                                    }}>
                                      {/* Special glow effect for legendary tiers */}
                                      {isSpecial && (
                                        <div style={{
                                          position: "absolute",
                                          top: "0",
                                          left: "0",
                                          right: "0",
                                          bottom: "0",
                                          background: "linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.1), transparent)",
                                          animation: "shimmer 3s infinite",
                                          pointerEvents: "none"
                                        }}></div>
                                      )}
                                      
                                      <div style={{ 
                                        fontSize: "1.2em", 
                                        marginBottom: "2px",
                                        position: "relative",
                                        zIndex: 1
                                      }}>
                                        {completed ? "✅" : current ? milestone.icon : isSpecial ? milestone.icon : "⚪"}
                                      </div>
                                      
                                      <div style={{ 
                                        fontWeight: "bold", 
                                        fontSize: "0.85em",
                                        color: isSpecial ? "#e91e63" : "inherit",
                                        position: "relative",
                                        zIndex: 1
                                      }}>
                                        {milestone.hours}h
                                      </div>
                                      
                                      <div style={{ 
                                        opacity: 0.8,
                                        color: isSpecial ? "#9c27b0" : "inherit",
                                        position: "relative",
                                        zIndex: 1
                                      }}>
                                        {milestone.reward} BITS
                                      </div>
                                      
                                      {isSpecial && (
                                        <div style={{
                                          fontSize: "0.7em",
                                          marginTop: "2px",
                                          color: "#ff9800",
                                          fontWeight: "bold",
                                          position: "relative",
                                          zIndex: 1
                                        }}>
                                          {milestone.name}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                      
                      <p style={{ marginTop: "15px", fontSize: "0.85em", opacity: 0.8 }}>
                        <strong>Group:</strong> BitSwapDEX Telegram | <strong>Tracking:</strong> 60s intervals, 10min idle
                      </p>
                      
                      {telegram.investigationData.explanation && (
                        <div style={{ 
                          background: "rgba(255, 152, 0, 0.1)", 
                          border: "1px solid rgba(255, 152, 0, 0.3)",
                          borderRadius: "6px",
                          padding: "10px",
                          margin: "10px 0",
                          fontSize: "0.9em"
                        }}>
                          <strong>ℹ️ System Status:</strong><br />
                          {telegram.investigationData.explanation}
                        </div>
                      )}
                      
                      {telegram.investigationData.error && (
                        <p style={{ color: "#ff9800", fontSize: "0.85em" }}>⚠️ {telegram.investigationData.error}</p>
                      )}
                      
                      <p style={{ fontSize: "0.8em", opacity: 0.7 }}>
                        <strong>Last Updated:</strong> {new Date(telegram.investigationData.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={async (e) => {
                    e.preventDefault();
                    console.log("🔍 Re-investigating Telegram data...");
                    setStatusMsg("🔄 Re-investigating Telegram data...");
                    await fetchTelegram(true); // Force refresh to bypass cache
                    setStatusMsg("✅ Investigation completed!");
                  }}
                  className="investigate-refresh-btn"
                  disabled={hybridLoading || loading}
                  style={{ flex: 1, minWidth: '200px' }}
                >
                  {(hybridLoading || loading) ? "🔄 Investigating..." : "🔍 Re-investigate Telegram Data"}
                </button>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("🧪 Testing Rate Limit Demo for wallet:", walletAddress);
                    setStatusMsg("🧪 Generating Rate Limit Demo Data...");
                    
                    // Simulate exact Error 429
                    const error429 = {
                      message: "HTTP 429: Too Many Requests",
                      response: { status: 429 }
                    };
                    
                    const demoData = generateOfflineData(walletAddress, error429, null);
                    console.log("📦 Demo data generated:", demoData);
                    setTelegram(demoData);
                    setStatusMsg(`✅ Demo: ${demoData.investigationData.totalHours}h → ${demoData.reward} BITS`);
                  }}
                  className="investigate-refresh-btn"
                  style={{ 
                    flex: 1, 
                    minWidth: '150px',
                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    fontSize: '0.9em'
                  }}
                >
                  🧪 Force Rate Limit Demo
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMsg && <p style={{ marginTop: "12px", color: "#00ffaa" }}>{statusMsg}</p>}
        </>
      )}

      <TransactionPopup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        token={popupData.token}
        amount={popupData.amount}
        bits={popupData.bits}
        txHash={popupData.txHash}
        explorerLink={`https://bscscan.com/tx/${popupData.txHash}`}
      />

      <RewardStatsSection
        referral={referral}
        telegram={telegram}
        referralCode={referralCode}
        nodeRewardBalance={nodeRewardBalance}
        rewardTiers={rewardTiers}
        hybridError={hybridError}
      />
    </div>
  );
};

export default ReferralRewardBox;
