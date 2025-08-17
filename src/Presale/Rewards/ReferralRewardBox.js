// src/Presale/Rewards/ReferralRewardBox.js
import React, { useState, useEffect } from "react";
import { default as axios } from "axios";
import TransactionPopup from "../TransactionPopup";
import RewardStatsSection from "./RewardStatsSection";
import "./ReferralRewardBox.css";

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

const ReferralRewardBox = ({ walletAddress }) => {
  const [referral, setReferral] = useState({ reward: null, claimed: false });
  const [telegram, setTelegram] = useState({ reward: null });
  const [referralCode, setReferralCode] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const [popupData, setPopupData] = useState({
    token: "Referral",
    amount: 0,
    bits: 0,
    txHash: "",
  });

  useEffect(() => {
    if (walletAddress) {
      fetchReferral();
      fetchTelegram();
    }
  }, [walletAddress]);

  const fetchReferral = async () => {
    try {
      const { data } = await axios.get(`/api/referral/reward/${walletAddress}`);
      setReferral({ reward: data.reward, claimed: data.claimed });
    } catch {
      setReferral({ reward: null, claimed: false });
    }
  };

  const fetchTelegram = async () => {
    try {
      const { data } = await axios.get(`/api/telegram-rewards/reward/${walletAddress}`);
      setTelegram({ reward: data.reward });
    } catch {
      setTelegram({ reward: null });
    }
  };

  const handleClaim = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post("/api/referral/claim", { walletAddress });

      setReferral((prev) => ({ ...prev, claimed: true }));
      setStatusMsg(`🎉 Referral claimed! Tx: ${data.txHash}`);

      setPopupData({
        token: "Referral",
        amount: referral.reward,
        bits: referral.reward,
        txHash: data.txHash,
      });
      setPopupVisible(true);
    } catch (err) {
      const error = err.response?.data?.error || err.message;
      setStatusMsg(`❌ Claim failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    try {
      const { data } = await axios.post(`${backendURL}/api/invite/generate-code`, {
        walletAddress,
        firstName: "WebUser",
      });
      setReferralCode(data.code);
      setStatusMsg(data.alreadyExists
        ? `🔁 You already have a referral code: ${data.code}`
        : `🎉 Referral code generated: ${data.code}`
      );
    } catch (err) {
      setStatusMsg("❌ Failed to generate referral code.");
    }
  };

  const handleCopy = () => {
    const fullLink = `https://bits-ai.io/?ref=${referralCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullLink)
        .then(() => {
          setCopied(true);
          setStatusMsg("📋 Referral link copied to clipboard!");
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => setStatusMsg("❌ Failed to copy referral link."));
    } else {
      const tempInput = document.createElement("input");
      tempInput.value = fullLink;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      setCopied(true);
      setStatusMsg("📋 Referral link copied (fallback)!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderReferral = () => {
    if (referral.reward !== null) {
      return (
        <>
          <p>🏷️ Referral Reward: <span className="reward-amount">{referral.reward}</span> BITS</p>
          <button
            className="claim-button"
            disabled={referral.claimed || loading}
            onClick={handleClaim}
          >
            {referral.claimed ? "✅ Referral Claimed" : "Claim Referral"}
          </button>
        </>
      );
    }

    if (!walletAddress) return null;

    return (
      <>
        <p>😔 No referral reward found.</p>
        <button className="claim-button" onClick={generateReferralCode}>
          🎯 Generate Invite Code
        </button>

        {referralCode && (
          <>
            <p>📨 Your Invite Code: <strong>{referralCode}</strong></p>

            <div className="share-buttons">
              <div className="copy-wrapper">
                <button className="copy-button" onClick={handleCopy}>
                  📋 Copy Referral Link
                </button>
                {copied && <span className="tooltip copied-tooltip">Copied!</span>}
              </div>

              <button
                className="share-button"
                onClick={() => {
                  const telegramLink = `https://t.me/share/url?url=https://bits-ai.io/?ref=${referralCode}&text=🎁%20Join%20BitSwapDEX%20and%20earn%20$BITS%20with%20my%20invite!`;
                  window.open(telegramLink, "_blank");
                }}
              >
                🔗 Share on Telegram
              </button>
            </div>
          </>
        )}
      </>
    );
  };

  const renderTelegram = () => {
    return telegram.reward !== null
      ? <p>💬 Telegram Reward: <strong>{telegram.reward}</strong> BITS</p>
      : <p>📭 No Telegram reward found.</p>;
  };

  return (
    <div className="referral-reward-box">
      <h3>🎁 Your Rewards</h3>

      {!walletAddress ? (
        <p>🔌 Connect your wallet to see rewards.</p>
      ) : loading ? (
        <p>⏳ Loading reward data...</p>
      ) : (
        <>
          {renderReferral()}
          {renderTelegram()}
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
      />
    </div>
  );
};

export default ReferralRewardBox;
