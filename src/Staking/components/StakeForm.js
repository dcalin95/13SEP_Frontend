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

  // ✅ Pre-fill amount from rewards
  useEffect(() => {
    if (prefilledAmount && !amount) {
      setAmount(prefilledAmount);
    }
  }, [prefilledAmount, amount]);

  // ✅ Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!signer || !walletAddress) return;
      try {
        const token = await getContractInstance("BITS");
        const raw = await token.balanceOf(walletAddress);
        setBalance(ethers.utils.formatUnits(raw, 18));
      } catch (err) {
        console.error("Error fetching BITS balance:", err.message);
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
      <h3>🔐 Stake $BITS</h3>

      {/* Rewards Pre-filled Banner */}
      {rewardsSource && (
        <div style={{
          background: "rgba(0, 255, 195, 0.1)",
          border: "1px solid rgba(0, 255, 195, 0.3)",
          borderRadius: "6px",
          padding: "8px",
          marginBottom: "12px",
          fontSize: "0.9em",
          textAlign: "center"
        }}>
          🎁 <strong>Staking Rewards:</strong> Pre-filled with claimed amount
        </div>
      )}

      <p><strong>Wallet:</strong> {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
      <p><strong>Available:</strong> {balance} BITS</p>
      <p><strong>APR:</strong> {(parseFloat(apr) / 1e16).toFixed(2)}%</p>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Enter amount to stake"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          style={{ textAlign: "left", color: "#000", background: "#fff", padding: "8px" }}
        />
        <button onClick={() => setAmount(balance)} disabled={loading}>Max</button>
        <button onClick={() => setAmount("")} disabled={loading}>🧹 Clear</button>
      </div>

      <button onClick={handleStake} disabled={loading || !amount}>
        {loading ? "Processing..." : "📥 Stake"}
      </button>

      {amount && estimatedReward !== "0" && (
        <p className="reward-estimate">
          🔮 Estimated yearly reward: <strong>{estimatedReward}</strong> BITS
        </p>
      )}

      <ToastContainer position="top-right" autoClose={4000} pauseOnHover />
    </div>
  );
};

export default StakeForm;
