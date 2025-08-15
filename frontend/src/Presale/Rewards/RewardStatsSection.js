import React from "react";
import "./rewards.css";

const RewardStatsSection = ({ referral, telegram, referralCode }) => {
  return (
    <div className="reward-stats-section">
      <h4>📊 Rewards Summary</h4>

      <p>📢 Invite friends and earn $BITS based on their activity on Telegram and Presale!</p>

      <div className="reward-stats-grid">
        <div className="reward-card">
          <h5>🏷️ Referral Reward</h5>
          <p><strong>{referral?.reward ?? 0}</strong> BITS</p>
          <p>Status: {referral?.claimed ? "✅ Claimed" : "⌛ Unclaimed"}</p>
        </div>

        <div className="reward-card">
          <h5>💬 Telegram Reward</h5>
          <p><strong>{telegram?.reward ?? 0}</strong> BITS</p>
          <p>Eligible? {telegram?.reward > 0 ? "✅ Yes" : "❌ No"}</p>
        </div>

        <div className="reward-card">
          <h5>🔗 Invite Code</h5>
          <p>
            {referralCode ? (
              <code>{referralCode}</code>
            ) : (
              <em>Not generated</em>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RewardStatsSection;
