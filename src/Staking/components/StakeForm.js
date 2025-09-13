import React, { useState, useContext, useEffect } from "react";
import { ethers } from "ethers";
import { getStakingContract, executeStakingCall } from "../../contract/getStakingContract";
import { getContractInstance } from "../../contract/getContract";
import { getRobustProvider, executeWithFallback } from "../../utils/rpcFallback";
import WalletContext from "../../context/WalletContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/StakeForm.css";

const StakeForm = ({ signer, prefilledAmount, rewardsSource }) => {
  const { walletAddress } = useContext(WalletContext);

  // Basic states
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [apr, setApr] = useState("0");
  const [estimatedReward, setEstimatedReward] = useState("0");
  const [loading, setLoading] = useState(false);

  // Advanced staking states
  const [selectedLockPeriod, setSelectedLockPeriod] = useState(0);
  const [autoCompound, setAutoCompound] = useState(false);
  const [compoundFrequency, setCompoundFrequency] = useState(7);
  const [currentTier, setCurrentTier] = useState({ name: "Bronze", bonus: 0, min: 1, max: 1000, color: "#CD7F32", icon: "🥉" });

  // Static data for tiers and lock periods
  const TIERS = [
    { name: "Bronze", min: 1, max: 1000, bonus: 0, color: "#CD7F32", icon: "🥉" },
    { name: "Silver", min: 1001, max: 5000, bonus: 2, color: "#C0C0C0", icon: "🥈" },
    { name: "Gold", min: 5001, max: 10000, bonus: 5, color: "#FFD700", icon: "🥇" },
    { name: "Platinum", min: 10001, max: Infinity, bonus: 10, color: "#E5E4E2", icon: "💎" }
  ];

  const LOCK_PERIODS = [
    { name: "Flexible", days: 0, bonus: 0, color: "#00ff88", icon: "🔓" },
    { name: "30 Days", days: 30, bonus: 10, color: "#00aaff", icon: "📅" },
    { name: "90 Days", days: 90, bonus: 25, color: "#ff6b00", icon: "🗓️" },
    { name: "180 Days", days: 180, bonus: 50, color: "#ff00aa", icon: "📆" },
    { name: "365 Days", days: 365, bonus: 100, color: "#aa00ff", icon: "🔒" }
  ];

  // ✅ Set prefilled amount from rewards
  useEffect(() => {
    if (prefilledAmount && prefilledAmount > 0) {
      setAmount(prefilledAmount.toString());
    }
  }, [prefilledAmount]);

  // ✅ Calculate tier based on amount
  useEffect(() => {
    if (amount && !isNaN(amount) && TIERS.length > 0) {
      const amountNum = parseFloat(amount);
      const tier = TIERS.find(t => amountNum >= t.min && amountNum <= t.max) || TIERS[0];
      setCurrentTier(tier);
    }
  }, [amount, TIERS]);

  // ✅ Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!signer || !walletAddress) return;
      try {
        const token = await getContractInstance("BITS");
        const raw = await token.balanceOf(walletAddress);
        setBalance(ethers.utils.formatUnits(raw, 18));
      } catch (err) {
        console.error("Error fetching $BITS balance:", err.message);
      }
    };
    fetchBalance();
  }, [signer, walletAddress]);

  // ✅ Fetch APR
  useEffect(() => {
    const fetchAPR = async () => {
      if (!signer) return;
      try {
        const contract = getStakingContract(signer);
        const rawApr = await contract.currentAPR();
        console.log("📊 Raw APR:", rawApr.toString());
        setApr(rawApr.toString());
      } catch (err) {
        console.error("Error fetching APR:", err.message);
      }
    };
    fetchAPR();
  }, [signer]);

  // ✅ Estimate reward with tier and lock bonuses
  useEffect(() => {
    if (!amount || isNaN(amount) || apr === "0") {
      setEstimatedReward("0");
      return;
    }

    try {
      const amtWei = ethers.utils.parseUnits(amount.toString(), 18);
      const aprBn = ethers.BigNumber.from(apr);
      
      // Add tier and lock bonuses
      const tierBonus = currentTier.bonus || 0; // in percent
      const lockBonus = (LOCK_PERIODS[selectedLockPeriod] || { bonus: 0 }).bonus; // in percent
      const totalBonus = tierBonus + lockBonus; // total bonus percent
      
      // Calculate final APR: base + bonuses
      const bonusMultiplier = ethers.BigNumber.from(100 + totalBonus); // 100% + bonuses
      const finalAPR = aprBn.mul(bonusMultiplier).div(100);
      
      const yearlyReward = amtWei.mul(finalAPR).div(ethers.constants.WeiPerEther);
      const baseReward = amtWei.mul(aprBn).div(ethers.constants.WeiPerEther);
      
      setEstimatedReward({
        total: ethers.utils.formatUnits(yearlyReward, 18),
        base: ethers.utils.formatUnits(baseReward, 18),
        bonusPercent: totalBonus,
        tierBonus,
        lockBonus
      });
    } catch (err) {
      console.warn("Reward calculation failed:", err.message);
      setEstimatedReward("0");
    }
  }, [amount, apr, currentTier, selectedLockPeriod]);

  const handleStake = async () => {
    if (!signer || !walletAddress) {
      toast.error("❌ Please connect your wallet first!");
      return;
    }

    const parsed = ethers.utils.parseUnits(amount, 18);
    if (parsed.lte(0)) {
      toast.warn("Please enter a positive amount.");
      return;
    }
    if (parsed.gt(ethers.utils.parseUnits(balance, 18))) {
      toast.error("Insufficient $BITS balance.");
      return;
    }

    setLoading(true);
    try {
      // Check network first
      const network = await signer.provider.getNetwork();
      console.log("🌐 Current Network:", network);
      
      if (network.chainId !== 97) {
        toast.error(`❌ Please switch to BSC Testnet (Chain ID: 97). Current: ${network.chainId}`);
        setLoading(false);
        return;
      }

      // Use robust RPC system for contract calls
      let contract, token;
      try {
        contract = getStakingContract(signer);
        token = await getContractInstance("BITS");
      } catch (rpcErr) {
        console.warn("⚠️ Direct contract creation failed, trying robust fallback:", rpcErr.message);
        
        // Use robust provider system
        const robustProvider = await getRobustProvider();
        contract = getStakingContract(robustProvider);
        token = await getContractInstance("BITS");
        
        // For signing, we'll still need the signer
        contract = contract.connect(signer);
        token = token.connect(signer);
      }

      console.log("📋 Contract Addresses:");
      console.log("- BITS Token:", token.address);
      console.log("- Staking Contract:", contract.address);
      console.log("- User Wallet:", walletAddress);

      // Let's also check what was staked
      console.log("🔍 Checking user's stakes...");
      const userStakes = await contract.getStakeByUser(walletAddress);
      console.log("📊 User Stakes:", userStakes);
      
      if (userStakes.length > 0) {
        const lastStake = userStakes[userStakes.length - 1];
        console.log("📈 Latest Stake Details:");
        console.log("- Amount:", ethers.utils.formatUnits(lastStake.locked, 18), "BITS");
        console.log("- APR:", (lastStake.apr.toNumber() / 100).toFixed(1) + "%");
        console.log("- Lock Period:", lastStake.lockPeriod.toString(), "seconds");
        console.log("- Auto Compound:", lastStake.autoCompound);
        console.log("- Start Time:", new Date(lastStake.startTime.toNumber() * 1000).toLocaleString());
      }

      toast.info("🔍 Checking token allowance...");
      const allowance = await token.allowance(walletAddress, contract.address);
      console.log("🧪 Parsed amount:", parsed.toString());
console.log("🧪 Allowance:", allowance.toString());
console.log("🧪 Wallet address:", walletAddress);
console.log("🧪 Contract address:", contract.address);

      if (allowance.lt(parsed)) {
        toast.info("🔐 Approving token...");
        const txApprove = await token.approve(contract.address, parsed);
        await txApprove.wait();
        toast.success("✅ Token approved.");
      }

      toast.info("📥 Sending stake transaction...");
      const txStake = await contract.stake(parsed);
      await txStake.wait();

      setAmount("");
      toast.success("🎉 Stake successful!");

      // Refresh balance
      const raw = await token.balanceOf(walletAddress);
      setBalance(ethers.utils.formatUnits(raw, 18));
    } catch (err) {
      console.error("🚨 Stake error:", err);
      
      // Enhanced error handling with specific solutions
      if (err.message.includes("missing trie node") || err.message.includes("RPC Connection Error")) {
        toast.error("🌐 BSC Testnet RPC Issue: Switching to backup endpoints automatically...");
        
        // Try staking again immediately with robust RPC
        try {
          toast.info("🔄 Trying backup RPC automatically...");
          const robustProvider = await getRobustProvider();
          const backupContract = getStakingContract(robustProvider).connect(signer);
          const backupToken = await getContractInstance("BITS", robustProvider);
          
          // Retry the staking operation
          const backupTx = await backupContract.stake(parsed);
          await backupTx.wait();
          
          setAmount("");
          toast.success("🎉 Stake successful with backup RPC!");
          
          // Refresh balance
          const raw = await backupToken.balanceOf(walletAddress);
          setBalance(ethers.utils.formatUnits(raw, 18));
          return; // Exit successfully
        } catch (backupErr) {
          console.error("❌ Backup RPC also failed:", backupErr);
          toast.error("🌐 All RPC endpoints are experiencing issues. Please try again in a few minutes.");
        }
        
      } else if (err.message.includes("CALL_EXCEPTION")) {
        toast.error("📞 Contract Error: BSC Testnet might be overloaded. Try switching RPC in MetaMask or wait a few minutes.");
      } else if (err.message.includes("user rejected")) {
        toast.warn("🚫 Transaction cancelled by user");
      } else if (err.message.includes("insufficient funds")) {
        toast.error("💰 Insufficient BNB for gas fees - you need ~0.005 BNB for staking");
      } else if (err.message.includes("All") && err.message.includes("endpoints failed")) {
        toast.error("🌐 All BSC Testnet RPCs are down! Try: 1) Switch to BSC Mainnet 2) Wait 30 minutes 3) Use different wallet");
      } else if (err.code === 'NETWORK_ERROR') {
        toast.error("🌐 Network Error: Check your internet connection and wallet network settings");
      } else {
        // Fallback error with more context
        const errorMsg = err.reason || err.message || "Unknown blockchain error";
        toast.error("❌ Staking Failed: " + errorMsg);
        console.log("🔍 Full error object:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stake-form">
      <h2 className="ai-form-title">Staking Protocol</h2>
      
      {rewardsSource && (
        <div style={{
          background: "rgba(0, 255, 195, 0.2)",
          border: "1px solid rgba(0, 255, 195, 0.5)",
          borderRadius: "15px",
          padding: "15px",
          marginBottom: "20px",
          backdropFilter: "blur(10px)"
        }}>
          <p style={{ margin: "0", color: "rgba(255, 255, 255, 0.8)", fontSize: "1rem", textAlign: "center" }}>
            🎁 <strong>Rewards Integration:</strong> Your rewards are ready for staking!
          </p>
        </div>
      )}

      {/* AI Stats Display */}
      <div className="ai-stats-grid" style={{ marginBottom: "2rem", gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="ai-stat-item">
          <div className="ai-stat-label">Wallet</div>
          <div className="ai-stat-value" style={{ fontSize: "0.9rem" }}>
            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
          </div>
        </div>
        <div className="ai-stat-item">
          <div className="ai-stat-label">Available</div>
          <div className="ai-stat-value">{parseFloat(balance).toFixed(2)}</div>
          <div className="ai-stat-label">$BITS</div>
        </div>
        <div className="ai-stat-item">
          <div className="ai-stat-label">APR</div>
          <div className="ai-stat-value">{(parseFloat(apr) / 100).toFixed(2)}%</div>
          <div className="ai-stat-label">Rate</div>
        </div>
      </div>

      {/* 💰 MODERN INPUT SECTION */}
      <div className="ai-input-group">
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{ fontSize: "1.2rem" }}>💰</span>
            <span style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "rgba(0, 255, 200, 0.9)",
              textShadow: "0 0 8px rgba(0, 255, 200, 0.3)"
            }}>
              How much $BITS?
            </span>
          </div>
          <div style={{
            fontSize: "0.8rem",
            color: "rgba(255, 255, 255, 0.6)",
            background: "rgba(255, 255, 255, 0.1)",
            padding: "0.3rem 0.8rem",
            borderRadius: "20px"
          }}>
            Available: {Math.floor(parseFloat(balance))} $BITS
          </div>
        </div>
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Enter amount to stake..."
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            textAlign: "center",
            background: "rgba(0, 255, 200, 0.05)",
            border: "2px solid rgba(0, 255, 200, 0.2)",
            borderRadius: "12px",
            padding: "1rem",
            color: "rgba(0, 255, 200, 0.9)"
          }}
        />
        
        {/* AI Progress Bar */}
        {amount && (
          <div className="ai-progress-bar">
            <div 
              className="ai-progress-fill" 
              style={{ width: `${Math.min((parseFloat(amount) / parseFloat(balance)) * 100, 100)}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* 🏆 TIER SYSTEM */}
      {amount && !isNaN(amount) && (
        <div className="tier-display" style={{
          background: `linear-gradient(135deg, ${currentTier.color}20, ${currentTier.color}10)`,
          border: `1px solid ${currentTier.color}60`,
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "1.5rem",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.5rem" }}>{currentTier.icon}</span>
            <div>
              <h4 style={{ margin: 0, color: currentTier.color }}>{currentTier.name} Tier</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.8 }}>
                {currentTier.bonus > 0 ? `+${currentTier.bonus}% APR Bonus!` : "Base APR Rate"}
              </p>
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
            Range: {currentTier.min === 1 ? "1" : (currentTier.min || 0).toLocaleString()} - {currentTier.max === Infinity ? "∞" : (currentTier.max || 0).toLocaleString()} BITS
          </div>
        </div>
      )}

      {/* 🔒 LOCK PERIOD SELECTOR */}
      <div className="lock-periods" style={{ marginBottom: "1.5rem" }}>
        <label className="ai-input-label" style={{ marginBottom: "12px", display: "block" }}>
          🔒 Lock Period (Higher APR for longer locks)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px" }}>
          {LOCK_PERIODS.map((period, index) => (
            <div
              key={index}
              onClick={() => setSelectedLockPeriod(index)}
              style={{
                background: selectedLockPeriod === index 
                  ? `linear-gradient(135deg, ${period.color}, ${period.color}80)` 
                  : "rgba(255,255,255,0.1)",
                border: selectedLockPeriod === index 
                  ? `2px solid ${period.color}` 
                  : "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                padding: "12px 8px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            >
              <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>{period.icon}</div>
              <div style={{ fontSize: "0.8rem", fontWeight: "600", marginBottom: "2px" }}>{period.name}</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                {period.bonus > 0 ? `+${period.bonus}%` : "Base"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔄 AUTO-COMPOUND */}
      <div className="auto-compound" style={{ marginBottom: "1.5rem" }}>
        <label style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          cursor: "pointer",
          background: autoCompound ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.1)",
          padding: "12px",
          borderRadius: "8px",
          border: autoCompound ? "1px solid rgba(0,255,136,0.3)" : "1px solid rgba(255,255,255,0.2)"
        }}>
          <input
            type="checkbox"
            checked={autoCompound}
            onChange={(e) => setAutoCompound(e.target.checked)}
            style={{ accentColor: "#00ff88" }}
          />
          <span>🔄 Auto-Compound Rewards (maximize growth)</span>
        </label>
        
        {autoCompound && (
          <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem" }}>Frequency:</span>
            <select 
              value={compoundFrequency} 
              onChange={(e) => setCompoundFrequency(parseInt(e.target.value))}
              style={{ 
                background: "rgba(0,255,136,0.1)", 
                border: "1px solid rgba(0,255,136,0.3)", 
                borderRadius: "4px", 
                padding: "4px 8px", 
                color: "white" 
              }}
            >
              <option value={1}>Daily</option>
              <option value={7}>Weekly</option>
              <option value={30}>Monthly</option>
            </select>
          </div>
        )}
      </div>

      {/* AI Control Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
        <button 
          onClick={() => setAmount(balance)} 
          disabled={loading}
          style={{ 
            flex: 1, 
            background: "linear-gradient(45deg, #ff00ff, #00ff88)",
            padding: "0.8rem",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
        >
          💎 Max Stake
        </button>
        <button 
          onClick={() => setAmount("")} 
          disabled={loading}
          style={{ 
            flex: 1, 
            background: "linear-gradient(45deg, #ff6b35, #f7931e)",
            padding: "0.8rem",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
        >
          🗑️ Clear
        </button>
      </div>

      {/* Main Stake Button */}
      <button 
        onClick={handleStake} 
        disabled={loading || !amount}
        style={{
          width: "100%",
          background: loading || !amount 
            ? "rgba(255, 255, 255, 0.3)" 
            : "linear-gradient(135deg, #00ff88, #00aaff)",
          color: loading || !amount ? "#999" : "white",
          border: "none",
          borderRadius: "12px",
          padding: "16px 24px",
          fontSize: "1.1rem",
          fontWeight: "700",
          cursor: loading || !amount ? "not-allowed" : "pointer",
          marginTop: "1.5rem",
          marginBottom: "1rem",
          transition: "all 0.3s ease",
          boxShadow: loading || !amount 
            ? "none" 
            : "0 4px 15px rgba(0, 255, 136, 0.4)",
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}
        onMouseEnter={(e) => {
          if (!loading && amount) {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(0, 255, 136, 0.6)";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && amount) {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(0, 255, 136, 0.4)";
          }
        }}
      >
        {loading ? "🔄 Processing..." : `🚀 Stake ${amount || 0} BITS`}
      </button>

      {/* Enhanced Reward Estimation */}
      {amount && estimatedReward !== "0" && typeof estimatedReward === 'object' && (
        <div className="reward-estimate" style={{
          background: "linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,170,255,0.2))",
          border: "1px solid rgba(0,255,136,0.5)",
          borderRadius: "12px",
          padding: "16px",
          marginTop: "1rem"
        }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#00ff88" }}>📊 Estimated Yearly Rewards</h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>Base Reward:</div>
              <div style={{ fontSize: "1rem", fontWeight: "600" }}>{parseFloat(estimatedReward.base).toFixed(4)} BITS</div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>Total Reward:</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#00ff88" }}>{parseFloat(estimatedReward.total).toFixed(4)} BITS</div>
            </div>
          </div>
          
          {(estimatedReward.bonusPercent || 0) > 0 && (
            <div style={{ 
              background: "rgba(255,215,0,0.1)", 
              border: "1px solid rgba(255,215,0,0.3)", 
              borderRadius: "8px", 
              padding: "8px", 
              fontSize: "0.9rem" 
            }}>
              <div style={{ color: "#FFD700", fontWeight: "600" }}>🚀 Bonus Breakdown:</div>
              {/* Always show tier bonus */}
              <div>🏆 Tier Bonus: +{estimatedReward.tierBonus || 0}% ({currentTier.name})</div>
              
              {/* Always show lock bonus */}
              <div>🔒 Lock Bonus: +{estimatedReward.lockBonus || 0}% ({LOCK_PERIODS[selectedLockPeriod]?.name || "Flexible"})</div>
              
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "4px", marginTop: "4px" }}>
                📈 <strong>Total Bonus: +{estimatedReward.bonusPercent || 0}% APR</strong>
              </div>
            </div>
          )}
        </div>
      )}

      <ToastContainer position="top-right" autoClose={4000} pauseOnHover />
    </div>
  );
};

export default StakeForm;
