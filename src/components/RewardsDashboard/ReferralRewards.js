import React, { useEffect, useState, useContext } from "react";
import WalletContext from "../../context/WalletContext"; // Context pentru wallet
import { ethers } from "ethers";
import "./RewardsDashboard.css";
import contractABI from "../../abi/nodeABI.js"; // ABI-ul corect

const contractAddress = "0xA2AeEb08262EaA44D6f5A6b29Ddaf2F4378FDC2B";
const referralCodes = ["REF1", "REF2"]; // Coduri de referral pentru testare
const tokenAddress = "0x4c8788e3FdEa92f41Ef1cDaeD02F0Cb235d11E7a"; // Adresa tokenului BITS

const ReferralRewards = () => {
  const { walletAddress } = useContext(WalletContext); // Context pentru wallet
  const [referralRewards, setReferralRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Funcție pentru a obține soldurile referral
  const fetchReferralRewards = async () => {
    if (!walletAddress) {
      setError("Wallet not connected. Please connect your wallet.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const rewardsData = await Promise.all(
        referralCodes.map(async (code) => {
          const [rate1, rate2] = await contract.getRefCodeRates(code);
          const balanceBN = await contract.codeBalanceOf(tokenAddress, code);

          return {
            code,
            rate1: `${(rate1 / 10).toFixed(2)}%`,
            rate2: `${(rate2 / 10).toFixed(2)}%`,
            balance: parseFloat(ethers.utils.formatUnits(balanceBN, 18)).toFixed(4),
          };
        })
      );

      setReferralRewards(rewardsData);
    } catch (error) {
      console.error("Error fetching referral rewards:", error);
      setError("Failed to fetch referral rewards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru a revendica rewardul referral
  const claimReferralReward = async (code) => {
    if (!walletAddress) {
      alert("Wallet not connected.");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 oră de acum
      const dummySignature = {
        r: "0x0000000000000000000000000000000000000000000000000000000000000000",
        s: "0x0000000000000000000000000000000000000000000000000000000000000000",
        v: 0,
      };

      await contract.claimRefCode(
        [tokenAddress], // Token array
        code,
        deadline,
        dummySignature.v,
        dummySignature.r,
        dummySignature.s
      );

      alert(`Reward successfully claimed for referral code: ${code}`);
      fetchReferralRewards(); // Refresh după claim
    } catch (error) {
      console.error("Error claiming referral reward:", error);
      alert("Failed to claim reward. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralRewards();
  }, [walletAddress]);

  return (
    <div>
      <h4>Referral Rewards</h4>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p>Loading referral rewards...</p>
      ) : referralRewards.length > 0 ? (
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Referral Code</th>
              <th>Level 1 Rate</th>
              <th>Level 2 Rate</th>
              <th>Reward Balance (BITS)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {referralRewards.map((reward, index) => (
              <tr key={index}>
                <td>{reward.code}</td>
                <td>{reward.rate1}</td>
                <td>{reward.rate2}</td>
                <td>{reward.balance}</td>
                <td>
                  <button
                    className="reward-button"
                    onClick={() => claimReferralReward(reward.code)}
                    disabled={!parseFloat(reward.balance) || loading}
                  >
                    Claim Reward
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No referral rewards available.</p>
      )}
    </div>
  );
};

export default ReferralRewards;


