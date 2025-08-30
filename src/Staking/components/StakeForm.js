import React, { useState, useContext, useEffect } from "react";
import { ethers } from "ethers";
import { getStakingContract } from "../../contract/getStakingContract";
import { getContractInstance } from "../../contract/getContract";
import WalletContext from "../../context/WalletContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/StakeForm.css";

const StakeForm = ({ signer, prefilledAmount, rewardsSource }) => {
  const { walletAddress } = useContext(WalletContext);

  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [apr, setApr] = useState("0");
  const [estimatedReward, setEstimatedReward] = useState("0");
  const [loading, setLoading] = useState(false);

  // ✅ Set prefilled amount from rewards
  useEffect(() => {
    if (prefilledAmount && prefilledAmount > 0) {
      setAmount(prefilledAmount.toString());
    }
  }, [prefilledAmount]);

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

  // ✅ Estimate reward
  useEffect(() => {
    if (!amount || isNaN(amount) || apr === "0") {
      setEstimatedReward("0");
      return;
    }

    try {
      const amtWei = ethers.utils.parseUnits(amount.toString(), 18);
      const aprBn = ethers.BigNumber.from(apr);
      const yearlyReward = amtWei.mul(aprBn).div(ethers.constants.WeiPerEther);
      setEstimatedReward(ethers.utils.formatUnits(yearlyReward, 18));
    } catch (err) {
      console.warn("Reward calculation failed:", err.message);
      setEstimatedReward("0");
    }
  }, [amount, apr]);

  const handleStake = async () => {
    if (!signer || !walletAddress) return;

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
      const contract = getStakingContract(signer);
      const token = await getContractInstance("BITS");

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
      console.error("Stake error:", err.message);
      toast.error("❌ Error: " + err.message);
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
          <div className="ai-stat-value">{(parseFloat(apr) / 1e16).toFixed(2)}%</div>
          <div className="ai-stat-label">Rate</div>
        </div>
      </div>

      {/* AI Input Section */}
      <div className="ai-input-group">
        <label className="ai-input-label">Stake Amount ($BITS)</label>
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Enter staking amount..."
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
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

      {/* AI Control Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
        <button 
          onClick={() => setAmount(balance)} 
          disabled={loading}
          style={{ 
            flex: 1, 
            background: "linear-gradient(45deg, #ff00ff, #00ff88)",
            padding: "0.8rem"
          }}
        >
          Max Stake
        </button>
        <button 
          onClick={() => setAmount("")} 
          disabled={loading}
          style={{ 
            flex: 1, 
            background: "linear-gradient(45deg, #ff6b35, #f7931e)",
            padding: "0.8rem"
          }}
        >
          Clear
        </button>
      </div>

      {/* Main Stake Button */}
      <button onClick={handleStake} disabled={loading || !amount}>
        {loading ? "Processing..." : "Stake Tokens"}
      </button>

      {/* Reward Estimation */}
      {amount && estimatedReward !== "0" && (
        <div className="reward-estimate">
          Estimated Yearly Reward: <strong>{estimatedReward}</strong> $BITS
        </div>
      )}

      <ToastContainer position="top-right" autoClose={4000} pauseOnHover />
    </div>
  );
};

export default StakeForm;
