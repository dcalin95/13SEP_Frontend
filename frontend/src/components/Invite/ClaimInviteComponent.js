import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./ClaimInviteComponent.css";

const FULL_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
const API_ROOT = FULL_BACKEND_URL.replace("/api/invite", "");

const NODE_CONTRACT_ADDRESS = process.env.REACT_APP_NODE_CONTRACT_ADDRESS || process.env.REACT_APP_NODE;
const TOKEN_CONTRACT_ADDRESS = process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS || process.env.REACT_APP_BITS_TOKEN;

const ClaimInviteComponent = () => {
  const [referralCode, setReferralCode] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [rewardInfo, setRewardInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // 1️⃣ Detectare automată a wallet-ului conectat
  useEffect(() => {
    const detectWallet = async () => {
      if (!window.ethereum) {
        setMessage("❌ Please install MetaMask to claim your reward.");
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setMessage("⚠️ Please connect your wallet.");
        }
      } catch (err) {
        console.error("Wallet Error:", err);
        setMessage("❌ Wallet access denied.");
      }
    };

    detectWallet();
  }, []);

  // 2️⃣ Verificare cod
  const handleCheckCode = async () => {
    setLoading(true);
    setMessage("");
    setRewardInfo(null);

    if (!referralCode.trim()) {
      setMessage("⚠️ Please enter a referral code.");
      setLoading(false);
      return;
    }

    if (!walletAddress) {
      setMessage("⚠️ Wallet not connected.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_ROOT}/api/claim/check`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode, wallet: walletAddress }),
      });

      const result = await response.json();

      if (response.ok) {
        setRewardInfo(result);
        setMessage("✅ Reward available!");
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Check Error:", error);
      setMessage("❌ Could not check reward.");
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Claim
  const handleClaim = async () => {
    setClaiming(true);
    setMessage("");

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      const chainId = await signer.getChainId();

      if (userAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        setMessage("⚠️ Wallet mismatch. Please reconnect.");
        setClaiming(false);
        return;
      }

      if (chainId !== 97) {
        setMessage("⚠️ Please switch your wallet to BSC Testnet (Chain ID 97).");
        setClaiming(false);
        return;
      }

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const domain = {
        name: "Node",
        version: "1",
        chainId,
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
        tokens: [TOKEN_CONTRACT_ADDRESS],
        code: referralCode,
        user: userAddress,
        deadline,
      };

      const signature = await signer._signTypedData(domain, types, value);
      const { r, s, v } = ethers.utils.splitSignature(signature);

      const claimResponse = await fetch(`${API_ROOT}/api/claim/claim`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralCode,
          signature: { r, s, v },
        }),
      });

      const claimResult = await claimResponse.json();

      if (claimResponse.ok) {
        setMessage("🎉 Reward claimed successfully!");
        setRewardInfo(null);
        setReferralCode("");
      } else {
        setMessage(`❌ ${claimResult.message}`);
      }
    } catch (error) {
      console.error("Claim Error:", error);
      setMessage("❌ Failed to claim reward.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="claim-invite-container">
      <h2>🎁 Claim Your Invite Reward</h2>

      <input
        type="text"
        placeholder="Enter referral code"
        value={referralCode}
        onChange={(e) => setReferralCode(e.target.value)}
        className="input-field"
      />

      <button onClick={handleCheckCode} className="claim-button" disabled={loading}>
        {loading ? "Checking..." : "Check Code"}
      </button>

      {message && <p className="message">{message}</p>}

      {rewardInfo && (
        <div className="reward-info">
          <p>
            You have <strong>{rewardInfo.rewardPercentage}%</strong> to claim from{" "}
            <strong>{rewardInfo.amountPurchased} $BITS</strong>, which is{" "}
            <strong>{rewardInfo.rewardAmount} $BITS</strong>.
          </p>
          <button onClick={handleClaim} className="claim-button" disabled={claiming}>
            {claiming ? "Claiming..." : "Claim Now"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ClaimInviteComponent;
