import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import "./InviteButton.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

const InviteButton = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [referrerCode, setReferrerCode] = useState("");

  // 1️⃣ Detectează wallet + cod referral din URL
  useEffect(() => {
    const detectWalletAndReferrer = async () => {
      // Wallet
      if (!window.ethereum) {
        setError("❌ Please install MetaMask to continue.");
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setError("⚠️ No wallet connected.");
        }
      } catch (err) {
        setError("⚠️ Wallet access denied.");
        console.error(err);
      }

      // Referral code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromURL = urlParams.get("ref");
      if (codeFromURL) setReferrerCode(codeFromURL);
    };

    detectWalletAndReferrer();
  }, []);

  // 2️⃣ Generează sau recuperează codul
  const handleCheckOrGenerateCode = async () => {
    setMessage("");
    setInviteCode("");
    setIsLoading(true);

    if (!walletAddress) {
      setMessage("⚠️ No wallet detected.");
      setIsLoading(false);
      return;
    }

    try {
   const response = await fetch(`${BACKEND_URL}/api/invite/generate-code`, {

  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    walletAddress,
    firstName: "FrontendUser",
    referrerCode: referrerCode || null,
  }),
});


      const data = await response.json();

      if (response.ok) {
        setInviteCode(data.code);

        if (data.alreadyExists) {
          setMessage("ℹ️ You already have an invite code.");
        } else {
          setMessage("🎉 Invite code generated!");
          handleConfetti();
        }
      } else {
        setMessage(`❌ ${data.message || "Failed to generate code."}`);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("❌ Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3️⃣ Copiază codul
  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // 4️⃣ Confetti vizual
  const handleConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#00ffff", "#ffcc00", "#ffffff"],
    });
  };

  return (
    <div className="invite-section">
      <div className="invite-button-container">
        <h2 className="invite-title">Your Cosmic Journey Starts Here</h2>
        <p className="invite-description">
          Invite your friends and earn <span className="highlight">rewards</span>! Together we grow the $BITS universe.
        </p>

        <input
          type="text"
          placeholder="Wallet Address"
          value={walletAddress}
          disabled
          className="wallet-input"
        />

        <button onClick={handleCheckOrGenerateCode} disabled={isLoading || !walletAddress} className="generate-button">
          {isLoading ? "Processing..." : "Get Invite Code"}
        </button>

        {error && <p className="message error">{error}</p>}
        {message && <p className="message">{message}</p>}

        {inviteCode && (
          <div className="code-section">
            <p className="invite-code">Invite Code: {inviteCode}</p>
            <button onClick={handleCopyCode} className="copy-button">
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        )}
      </div>

      <div className="invite-card">
        <h2 className="invite-card-title">🚀 Earn Rewards Beyond Limits</h2>
        <p className="invite-card-text">
          <span className="highlight-big">10% from direct invitees</span> and <span className="highlight-big">5% from second-level referrals</span>!
        </p>
        <div className="rewards-container">
          <div className="reward-box" onMouseEnter={handleConfetti}>
            <span className="reward-title">10%</span>
            <p className="reward-desc">Direct Referrals</p>
          </div>
          <div className="reward-box" onMouseEnter={handleConfetti}>
            <span className="reward-title">5%</span>
            <p className="reward-desc">Second-Level Referrals</p>
          </div>
        </div>
        <p className="invite-card-footer">
          Share your code and grow the $BITS galaxy!
        </p>
      </div>
    </div>
  );
};

export default InviteButton;
