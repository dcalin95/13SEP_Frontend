import React from "react";
import "./rewards.css";

const RewardStatsSection = ({ referral, telegram, referralCode }) => {
  // Helper function to format seconds to H:MM
  const formatSecondsToHourMinutes = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Calculate Telegram activity data
  const totalHours = telegram?.investigationData?.totalHours || 0;
  const messagesTotal = telegram?.investigationData?.messagesTotal || 0;
  const activityRate = telegram?.investigationData?.activityRate || 0;
  const totalSeconds = totalHours * 3600;
  const rewardBreakdown = telegram?.investigationData?.rewardBreakdown;

  // 🚀 NEW REWARD SYSTEM: Progress calculation for next milestone
  const getNextTimeMilestone = (hours) => {
    if (hours < 5) return { target: 5, reward: 200, type: 'time' };
    if (hours < 20) return { target: 20, reward: 800, type: 'time' };
    if (hours < 50) return { target: 50, reward: 2500, type: 'time' };
    if (hours < 100) return { target: 100, reward: 6000, type: 'time' };
    if (hours < 200) return { target: 200, reward: 15000, type: 'time' };
    if (hours < 500) return { target: 500, reward: 50000, type: 'time' };
    return null;
  };

  const getNextMessageMilestone = (messages) => {
    if (messages < 50) return { target: 50, reward: 100, type: 'message' };
    if (messages < 200) return { target: 200, reward: 500, type: 'message' };
    if (messages < 500) return { target: 500, reward: 1500, type: 'message' };
    if (messages < 1000) return { target: 1000, reward: 4000, type: 'message' };
    if (messages < 2000) return { target: 2000, reward: 10000, type: 'message' };
    if (messages < 5000) return { target: 5000, reward: 30000, type: 'message' };
    return null;
  };

  const nextTimeMilestone = getNextTimeMilestone(totalHours);
  const nextMessageMilestone = getNextMessageMilestone(messagesTotal);
  const timeProgressPercent = nextTimeMilestone ? (totalHours / nextTimeMilestone.target) * 100 : 100;
  const messageProgressPercent = nextMessageMilestone ? (messagesTotal / nextMessageMilestone.target) * 100 : 100;

  return (
    <div className="reward-stats-section">
      <h4>📊 Rewards Analytics</h4>

      <div className="reward-stats-grid">
        {/* Telegram Activity Card with Progress */}
        <div className="reward-card telegram-activity">
          <h5>💬 Telegram Activity</h5>
          
          {/* 🔗 Wallet Link Status */}
          {telegram?.investigationData?.isLinked === false && (
            <div className="wallet-link-notice" style={{
              background: 'rgba(255, 170, 0, 0.1)',
              border: '1px solid rgba(255, 170, 0, 0.3)',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ffaa00', fontSize: '0.9em', fontWeight: '600' }}>
                🔗 Wallet Not Linked
              </div>
              <div style={{ color: '#ccd6f6', fontSize: '0.8em', marginTop: '5px' }}>
                Use <code>/linkwallet</code> in Telegram bot to connect
              </div>
            </div>
          )}
          
          <div className="activity-stats">
            <div className="time-display">
              <span className="hours-decimal">{totalHours.toFixed(2)}h</span>
              <span className="hours-formatted">({formatSecondsToHourMinutes(totalSeconds)})</span>
            </div>
            <div className="messages-display">
              📨 Messages: {messagesTotal}
            </div>
            <div className="activity-rate">
              📈 Rate: {activityRate} msg/h
            </div>
          </div>
          
          {/* 🚀 REWARD BREAKDOWN DISPLAY */}
          {rewardBreakdown && (
            <div className="reward-breakdown" style={{
              margin: '15px 0',
              padding: '12px',
              background: 'rgba(0, 255, 195, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 195, 0.3)'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px',
                fontSize: '0.9rem',
                marginBottom: '8px'
              }}>
                <div>⏰ Time Reward: <span style={{color: '#00ffc3'}}>{rewardBreakdown.time_reward?.toLocaleString() || 0} BITS</span></div>
                <div>💬 Message Reward: <span style={{color: '#ffaa00'}}>{rewardBreakdown.message_reward?.toLocaleString() || 0} BITS</span></div>
              </div>
              
              {rewardBreakdown.bonus_amount > 0 && (
                <div style={{ 
                  textAlign: 'center',
                  padding: '6px',
                  background: 'rgba(255, 170, 0, 0.2)',
                  borderRadius: '4px',
                  fontSize: '0.85rem'
                }}>
                  ✨ <strong>{rewardBreakdown.bonus_reasons?.join(', ') || 'Bonus'}</strong>: 
                  +{rewardBreakdown.bonus_amount?.toLocaleString() || 0} BITS 
                  ({((rewardBreakdown.bonus_multiplier - 1) * 100).toFixed(0)}% bonus!)
                </div>
              )}
              
              <div style={{ 
                textAlign: 'center',
                marginTop: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#00ffc3'
              }}>
                🎯 TOTAL: {rewardBreakdown.final_total?.toLocaleString() || 0} BITS
              </div>
            </div>
          )}
          
          {/* 🚀 DUAL PROGRESS BARS - TIME & MESSAGES */}
          <div className="dual-progress-container" style={{ marginTop: '15px' }}>
            {/* Time Progress */}
            {nextTimeMilestone && (
              <div className="milestone-progress">
                <div className="progress-info">
                  <span>⏰ Next: {nextTimeMilestone.target}h → {nextTimeMilestone.reward.toLocaleString()} BITS</span>
                  <span style={{ color: '#00ffc3' }}>{timeProgressPercent.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min(timeProgressPercent, 100)}%`,
                      background: 'linear-gradient(90deg, #00ffc3, #00aaff)'
                    }}
                  ></div>
                </div>
                <div className="time-remaining">
                  {nextTimeMilestone.target - totalHours > 0 && (
                    <span>⏰ {(nextTimeMilestone.target - totalHours).toFixed(1)}h remaining</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Message Progress */}
            {nextMessageMilestone && (
              <div className="milestone-progress" style={{ marginTop: '10px' }}>
                <div className="progress-info">
                  <span>💬 Next: {nextMessageMilestone.target} msgs → {nextMessageMilestone.reward.toLocaleString()} BITS</span>
                  <span style={{ color: '#ffaa00' }}>{messageProgressPercent.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min(messageProgressPercent, 100)}%`,
                      background: 'linear-gradient(90deg, #ffaa00, #ff6b6b)'
                    }}
                  ></div>
                </div>
                <div className="time-remaining">
                  {nextMessageMilestone.target - messagesTotal > 0 && (
                    <span>💬 {(nextMessageMilestone.target - messagesTotal).toLocaleString()} messages remaining</span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* 🎯 DUAL MOTIVATION TIMER */}
          {(nextTimeMilestone || nextMessageMilestone) && (totalHours > 0 || messagesTotal > 0) && (
            <div className="countdown-timer">
              <span>🎯 Keep chatting for DUAL rewards! Time + Messages = MORE BITS!</span>
            </div>
          )}
        </div>

        {/* Referral Card */}
        <div className="reward-card">
          <h5>🏷️ Referral Status</h5>
          <p><strong>{Math.round(referral?.reward ?? 0)}</strong> BITS</p>
          <p>Status: {referral?.claimed ? "✅ Claimed" : "⌛ Pending"}</p>
          <p>Code: {referralCode ? <code>{referralCode}</code> : <em>Generate first</em>}</p>
        </div>
      </div>

            {/* Simple Status Card */}
      <div className="reward-card">
        <h5>🔧 System Status</h5>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          fontSize: '0.9rem'
        }}>
          <div>
            <p><strong>🔗 Blockchain:</strong> ✅ Connected</p>
            <p><strong>⚡ Rewards:</strong> ✅ Active</p>
          </div>
          <div>
            <p><strong>🔐 Security:</strong> ✅ Protected</p>
            <p><strong>📊 Analytics:</strong> ✅ Tracking</p>
          </div>
        </div>
      </div>

      {/* 🚀 NEW DUAL MILESTONE ROADMAP */}
      <div className="milestone-roadmap">
        <h5>🎯 Dual Reward Milestones - TIME + MESSAGES</h5>
        
        {/* TIME MILESTONES */}
        <div className="milestone-category">
          <h6>⏰ Time Rewards (4-12x BIGGER!)</h6>
          <div className="milestones-grid">
            <div className={`milestone-card time ${totalHours >= 5 ? 'completed' : totalHours >= 2.5 ? 'near' : ''}`}>
              <div className="milestone-icon">🥉</div>
              <div className="milestone-info">
                <div className="milestone-target">5h</div>
                <div className="milestone-reward">200 BITS</div>
                <div className="milestone-status">
                  {totalHours >= 5 ? '✅ Completed' : `${(5 - totalHours).toFixed(1)}h left`}
                </div>
              </div>
            </div>
            
            <div className={`milestone-card time ${totalHours >= 20 ? 'completed' : totalHours >= 15 ? 'near' : ''}`}>
              <div className="milestone-icon">🥈</div>
              <div className="milestone-info">
                <div className="milestone-target">20h</div>
                <div className="milestone-reward">800 BITS</div>
                <div className="milestone-status">
                  {totalHours >= 20 ? '✅ Completed' : `${(20 - totalHours).toFixed(1)}h left`}
                </div>
              </div>
            </div>
            
            <div className={`milestone-card time ${totalHours >= 50 ? 'completed' : totalHours >= 40 ? 'near' : ''}`}>
              <div className="milestone-icon">🥇</div>
              <div className="milestone-info">
                <div className="milestone-target">50h</div>
                <div className="milestone-reward">2,500 BITS</div>
                <div className="milestone-status">
                  {totalHours >= 50 ? '✅ Completed' : `${(50 - totalHours).toFixed(1)}h left`}
                </div>
              </div>
            </div>
            
            <div className={`milestone-card time ${totalHours >= 100 ? 'completed' : totalHours >= 80 ? 'near' : ''}`}>
              <div className="milestone-icon">🏆</div>
              <div className="milestone-info">
                <div className="milestone-target">100h</div>
                <div className="milestone-reward">6,000 BITS</div>
                <div className="milestone-status">
                  {totalHours >= 100 ? '✅ Completed' : `${(100 - totalHours).toFixed(1)}h left`}
                </div>
              </div>
            </div>
            
            <div className={`milestone-card time special legend ${totalHours >= 200 ? 'completed shimmer' : totalHours >= 150 ? 'near' : ''}`}>
              <div className="milestone-icon">👑</div>
              <div className="milestone-info">
                <div className="milestone-target">200h LEGEND</div>
                <div className="milestone-reward">15,000 BITS</div>
                <div className="milestone-status">
                  {totalHours >= 200 ? '👑 LEGEND!' : `${(200 - totalHours).toFixed(1)}h left`}
                </div>
              </div>
            </div>
            
            <div className={`milestone-card time special immortal ${totalHours >= 500 ? 'completed rainbow' : totalHours >= 400 ? 'near' : ''}`}>
              <div className="milestone-icon">💎</div>
              <div className="milestone-info">
                <div className="milestone-target">500h IMMORTAL</div>
                <div className="milestone-reward">50,000 BITS</div>
                <div className="milestone-status">
                  {totalHours >= 500 ? '⚡ IMMORTAL!' : `${(500 - totalHours).toFixed(1)}h left`}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* MESSAGE MILESTONES */}
        <div className="milestone-category" style={{ marginTop: '20px' }}>
          <h6>💬 Message Rewards (BRAND NEW!)</h6>
          <div className="milestones-grid">
            <div className={`milestone-card message ${messagesTotal >= 50 ? 'completed' : messagesTotal >= 30 ? 'near' : ''}`}>
              <div className="milestone-icon">📝</div>
              <div className="milestone-info">
                <div className="milestone-target">50 msgs</div>
                <div className="milestone-reward">100 BITS</div>
                <div className="milestone-status">
                  {messagesTotal >= 50 ? '✅ Completed' : `${50 - messagesTotal} msgs left`}
                </div>
              </div>
            </div>
            
            <div className={`milestone-card message ${messagesTotal >= 200 ? 'completed' : messagesTotal >= 150 ? 'near' : ''}`}>
              <div className="milestone-icon">💬</div>
              <div className="milestone-info">
                <div className="milestone-target">200 msgs</div>
                <div className="milestone-reward">500 BITS</div>
                <div className="milestone-status">
                  {messagesTotal >= 200 ? '✅ Completed' : `${200 - messagesTotal} msgs left`}
                </div>
              </div>
            </div>
            
            <div className={`milestone-card message ${messagesTotal >= 500 ? 'completed' : messagesTotal >= 400 ? 'near' : ''}`}>
              <div className="milestone-icon">🗨️</div>
              <div className="milestone-info">
                <div className="milestone-target">500 msgs</div>
                <div className="milestone-reward">1,500 BITS</div>
                <div className="milestone-status">
                  {messagesTotal >= 500 ? '✅ Completed' : `${500 - messagesTotal} msgs left`}
                </div>
              </div>
            </div>
            
            <div className={`milestone-card message ${messagesTotal >= 1000 ? 'completed' : messagesTotal >= 800 ? 'near' : ''}`}>
              <div className="milestone-icon">💭</div>
              <div className="milestone-info">
                <div className="milestone-target">1000 msgs</div>
                <div className="milestone-reward">4,000 BITS</div>
                <div className="milestone-status">
                  {messagesTotal >= 1000 ? '✅ Completed' : `${1000 - messagesTotal} msgs left`}
                </div>
              </div>
            </div>
            
            <div className={`milestone-card message special ${messagesTotal >= 2000 ? 'completed shimmer' : messagesTotal >= 1500 ? 'near' : ''}`}>
              <div className="milestone-icon">🎤</div>
              <div className="milestone-info">
                <div className="milestone-target">2000 msgs SPEAKER</div>
                <div className="milestone-reward">10,000 BITS</div>
                <div className="milestone-status">
                  {messagesTotal >= 2000 ? '🎤 SPEAKER!' : `${2000 - messagesTotal} msgs left`}
                </div>
              </div>
            </div>
            
            <div className={`milestone-card message special immortal ${messagesTotal >= 5000 ? 'completed rainbow' : messagesTotal >= 4000 ? 'near' : ''}`}>
              <div className="milestone-icon">🎭</div>
              <div className="milestone-info">
                <div className="milestone-target">5000 msgs MASTER</div>
                <div className="milestone-reward">30,000 BITS</div>
                <div className="milestone-status">
                  {messagesTotal >= 5000 ? '🎭 CHAT MASTER!' : `${5000 - messagesTotal} msgs left`}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

      <div className="rewards-footer-info">
        <p>🚀 <strong>NEW SYSTEM:</strong> Dual rewards = 4-12x BIGGER rewards! Time + Messages!</p>
        <p>🎯 <strong>MULTIPLIERS:</strong> Achieve both milestones for +50% bonus!</p>
        <p>🔄 Activity is tracked in real-time. Rewards update automatically.</p>
      </div>
    </div>
  );
};

export default RewardStatsSection;
