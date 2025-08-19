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
  const [unifiedRewards, setUnifiedRewards] = useState({
    totalPending: 0,
    loading: false,
    error: null,
    mock: false
  });

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
      fetchUnifiedRewards();
    }
  }, [walletAddress]);

  const fetchUnifiedRewards = async () => {
    try {
      setUnifiedRewards(prev => ({ ...prev, loading: true }));
      const { data } = await axios.get(`https://backend-server-f82y.onrender.com/api/rewards/${walletAddress}`);
      setUnifiedRewards({
        totalPending: data.totalPending || 0,
        loading: false,
        error: null,
        mock: false
      });
    } catch (error) {
      setUnifiedRewards({
        totalPending: 0,
        loading: false,
        error: error.message,
        mock: true
      });
    }
  };

  const fetchReferral = async () => {
    try {
      console.log("🔍 [REFERRAL] Fetching referral data for wallet:", walletAddress);
      const { data } = await axios.get(`https://backend-server-f82y.onrender.com/api/referral/reward/${walletAddress}`);
      
      console.log("✅ [REFERRAL] Received data:", data);
      setReferral({ reward: data.reward || 0, claimed: data.claimed || false });
    } catch (err) {
      console.error("❌ [REFERRAL] Error fetching referral data:", err);
      setReferral({ reward: null, claimed: false });
    }
  };

  const fetchTelegram = async () => {
    try {
      console.log("🔍 [TELEGRAM] Fetching telegram data for wallet:", walletAddress);
      const { data } = await axios.get(`https://backend-server-f82y.onrender.com/api/telegram-rewards/reward/${walletAddress}`);
      
      console.log("✅ [TELEGRAM] Received data:", data);
      
      setTelegram({ 
        reward: data.reward || 0,
        investigationData: {
          expectedReward: data.reward || 0,
          totalHours: data.time_spent_hours || 0,
          messagesTotal: parseInt(data.messages_total || 0, 10), // ✅ FIXED: Force to number
          activityRate: data.time_spent_hours ? (parseInt(data.messages_total || 0, 10) / data.time_spent_hours).toFixed(1) : 0,
          timeSpent: data.time_spent || 0,
          timeSpentFormatted: data.time_spent ? `${Math.floor(data.time_spent / 3600)}:${Math.floor((data.time_spent % 3600) / 60).toString().padStart(2, '0')}h` : '0:00h',
          // 📱 DEBUGGING: Include message for user
          isLinked: data.telegram_id !== null,
          linkMessage: data.message || null,
          // 🚀 NEW: Include reward breakdown for detailed display
          rewardBreakdown: data.reward_breakdown || null
        }
      });
    } catch (err) {
      console.error("❌ [TELEGRAM] Error fetching telegram data:", err);
        setTelegram({ 
        reward: null, 
        investigationData: {
          expectedReward: 0,
          totalHours: 0,
          messagesTotal: 0,
          activityRate: 0,
        timeSpent: 0,
          timeSpentFormatted: '0:00h'
        }
      });
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

      {/* Total Unclaimed Rewards Section */}
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
                      {Math.round(totalUnclaimed)} $BITS
                    </div>
                    
                    <div className="ai-rewards-grid" style={{
                      display: 'grid',
                                              gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                      marginTop: '15px'
                    }}>
                      {/* Telegram Activity Card */}
                      <div className="ai-reward-card" style={{
                        background: 'linear-gradient(135deg, rgba(0, 255, 195, 0.08) 0%, rgba(0, 255, 255, 0.05) 100%)',
                        border: '1px solid rgba(0, 255, 195, 0.2)',
                        borderRadius: '12px',
                        padding: '20px',
                        backdropFilter: 'blur(8px)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {/* AI Glow Effect */}
                        <div style={{
                          position: 'absolute',
                          top: '-50%',
                          left: '-50%',
                          width: '200%',
                          height: '200%',
                          background: 'radial-gradient(circle, rgba(0, 255, 195, 0.03) 0%, transparent 70%)',
                          animation: 'pulse 3s ease-in-out infinite',
                          pointerEvents: 'none'
                        }}></div>
                        
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <span style={{
                              fontSize: '2.2rem',
                              marginRight: '12px',
                              filter: 'drop-shadow(0 0 12px rgba(0, 255, 195, 0.8))'
                            }}>🤖</span>
                            <span style={{
                              fontSize: '1.1rem',
                              fontWeight: '700',
                              color: '#00ffc3',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              textShadow: '0 0 12px rgba(0, 255, 195, 0.8)'
                            }}>AI Social Mining</span>
                          </div>
                          
                          <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            marginBottom: '12px',
                            textShadow: '0 0 16px rgba(0, 255, 195, 0.9)'
                          }}>
                            {Math.round(telegramPending)} BITS
                          </div>
                          
                          {telegram?.investigationData && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '10px',
                              fontSize: '1.1rem',
                              color: 'rgba(0, 255, 195, 0.95)',
                              fontWeight: '600'
                            }}>
                              <div style={{ textShadow: '0 0 10px rgba(0, 255, 195, 0.6)' }}>
                                ⏱️ {telegram.investigationData.timeSpentFormatted || `${telegram.investigationData.totalHours}h`}
                              </div>
                              <div style={{ textShadow: '0 0 10px rgba(0, 255, 195, 0.6)' }}>
                                💬 {telegram.investigationData.messagesTotal}
                              </div>
                              <div style={{ 
                                gridColumn: '1 / -1', 
                                textAlign: 'center', 
                                marginTop: '8px',
                                fontSize: '1rem',
                                textShadow: '0 0 10px rgba(0, 255, 195, 0.6)'
                              }}>
                                📊 {telegram.investigationData.activityRate} msg/h
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Referral Rewards Card */}
                      <div className="ai-reward-card" style={{
                        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(255, 204, 2, 0.05) 100%)',
                        border: '1px solid rgba(255, 179, 71, 0.2)',
                        borderRadius: '12px',
                        padding: '20px',
                        backdropFilter: 'blur(8px)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {/* AI Glow Effect */}
                        <div style={{
                          position: 'absolute',
                          top: '-50%',
                          left: '-50%',
                          width: '200%',
                          height: '200%',
                          background: 'radial-gradient(circle, rgba(255, 179, 71, 0.03) 0%, transparent 70%)',
                          animation: 'pulse 3s ease-in-out infinite 1s',
                          pointerEvents: 'none'
                        }}></div>
                        
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <span style={{
                              fontSize: '2.2rem',
                              marginRight: '12px',
                              filter: 'drop-shadow(0 0 12px rgba(255, 179, 71, 0.8))'
                            }}>🌐</span>
                            <span style={{
                              fontSize: '1.1rem',
                              fontWeight: '700',
                              color: '#ffb347',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              textShadow: '0 0 12px rgba(255, 179, 71, 0.8)'
                            }}>Network Rewards</span>
                          </div>
                          
                          <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            marginBottom: '12px',
                            textShadow: '0 0 16px rgba(255, 179, 71, 0.9)'
                          }}>
                            {Math.round(referralPending)} BITS
                          </div>
                          
                          <div style={{
                            fontSize: '1.1rem',
                            color: 'rgba(255, 179, 71, 0.95)',
                            textAlign: 'center',
                            fontWeight: '600',
                            textShadow: '0 0 10px rgba(255, 179, 71, 0.6)'
                          }}>
                            {referralPending > 0 ? '🎯 Active Rewards' : '💤 Invite Friends'}
                          </div>
                        </div>
                      </div>

                      {/* Other Rewards Card - Full Width */}
                      {unifiedPending > 0 && (
                        <div className="ai-reward-card" style={{
                          gridColumn: '1 / -1',
                          background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.08) 0%, rgba(75, 0, 130, 0.05) 100%)',
                          border: '1px solid rgba(138, 43, 226, 0.2)',
                          borderRadius: '12px',
                          padding: '12px',
                          backdropFilter: 'blur(8px)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: 'radial-gradient(circle, rgba(138, 43, 226, 0.03) 0%, transparent 70%)',
                            animation: 'pulse 3s ease-in-out infinite 2s',
                            pointerEvents: 'none'
                          }}></div>
                          
                          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '8px'
                            }}>
                              <span style={{
                                fontSize: '2.2rem',
                                marginRight: '12px',
                                filter: 'drop-shadow(0 0 12px rgba(138, 43, 226, 0.8))'
                              }}>⚡</span>
                              <span style={{
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                color: '#da70d6',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                textShadow: '0 0 12px rgba(138, 43, 226, 0.8)'
                              }}>AI Bonus Pool</span>
                            </div>
                            
                            <div style={{
                              fontSize: '2rem',
                              fontWeight: 'bold',
                              color: '#ffffff',
                              textShadow: '0 0 16px rgba(138, 43, 226, 0.9)'
                            }}>
                              {Math.round(unifiedPending)} BITS
                            </div>
                          </div>
                        </div>
                      )}
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
                        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
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
                          
                          <button
                            onClick={() => {
                              fetchUnifiedRewards();
                              fetchTelegram();
                              fetchReferral();
                            }}
                            style={{
                              background: "linear-gradient(90deg, #00aaff, #0088cc)",
                              color: "#ffffff",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              border: "none",
                              fontWeight: "bold",
                              fontSize: "0.9em",
                              cursor: "pointer",
                              display: "inline-block"
                            }}
                          >
                            🔄 Refresh Rewards
                          </button>
                        </div>
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
          </div>
        )}
      </div>

      <RewardStatsSection
        referral={referral}
        telegram={telegram}
        referralCode={referralCode}
      />
    </div>
  );
};

export default ReferralRewardBox;
