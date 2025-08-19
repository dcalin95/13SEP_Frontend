import React, { useState } from "react";
import usePaymentState from "./hooks/usePaymentState";
import useHandleTransaction from "./useHandleTransaction";
import PaymentSummary from "./PaymentSummary";
import InputBox from "./InputBox";
import TransactionPopup from "../TransactionPopup";
import PaymentTitle from "./components/PaymentTitle";
import PriceInfo from "./components/PriceInfo";
import PaymentLoading from "./components/PaymentLoading";
import PaymentError from "./components/PaymentError";
import PaymentMethodSelector from "./PaymentMethodSelector";
import "./PaymentBox.css";

const PaymentBox = ({
  selectedToken,
  selectedChain,
  amountPay,
  setAmountPay,
  tokenPrices,
  pricesLoading,
}) => {
  // 🎯 Custom Hook pentru toată logica de state
  const paymentState = usePaymentState({
    selectedToken,
    selectedChain,
    amountPay,
    setAmountPay,
    tokenPrices,
    pricesLoading,
  });

  // 📊 Transaction States
  const [transactionHash, setTransactionHash] = useState(null);
  const [confirmedBits, setConfirmedBits] = useState(null);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // 💳 Payment Method Selection States
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  // 🎁 Invite Code State
  const [inviteCode, setInviteCode] = useState('');
  const [autoDetectedCode, setAutoDetectedCode] = useState('');
  const [inviteCodeChecking, setInviteCodeChecking] = useState(false);
  
  // 🤝 NEW: Friend referral code states
  const [friendReferralCode, setFriendReferralCode] = useState('');
  const [friendCodeStatus, setFriendCodeStatus] = useState(null); // null, 'valid', 'invalid', 'applied'
  const [referralStatus, setReferralStatus] = useState(null); // Full referral status from backend

  // 🔄 Reset payment method when token changes
  React.useEffect(() => {
    console.log("🔄 [RESET] useEffect triggered - selectedToken changed to:", selectedToken);
    console.log("🔄 [RESET] Before reset - selectedPaymentMethod:", selectedPaymentMethod);
    console.log("🔄 [RESET] Before reset - showPaymentSelector:", showPaymentSelector);
    
    setSelectedPaymentMethod(null);
    setShowPaymentSelector(false);
    
    console.log("🔄 [RESET] After reset commands executed");
    
    // Verify reset after state update
    setTimeout(() => {
      console.log("🔄 [RESET] State after timeout - selectedPaymentMethod should be null");
    }, 100);
  }, [selectedToken]);

  // 🎁 Auto-detect invite code when wallet connects (OPTIMIZED with caching)
  React.useEffect(() => {
    const checkInviteCodeAndStatus = async () => {
      if (!paymentState.walletAddress || inviteCodeChecking) return;
      
      // 🚀 LOCAL CACHE: Check if we already have data for this wallet (avoid redundant calls)
      const cacheKey = `referral_data_${paymentState.walletAddress}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            console.log("🚀 [INVITE] Using cached referral data for:", paymentState.walletAddress);
            
            // Apply cached data
            if (parsed.inviteCode) {
              setAutoDetectedCode(parsed.inviteCode);
              setInviteCode(parsed.inviteCode);
            }
            if (parsed.referralStatus) {
              setReferralStatus(parsed.referralStatus);
              if (parsed.referralStatus.usedFriendCode) {
                setFriendReferralCode(parsed.referralStatus.usedFriendCode);
                setFriendCodeStatus('applied');
              }
            }
            return; // Exit early if cache is valid
          }
        } catch (e) {
          console.warn("⚠️ [INVITE] Cache parse error:", e.message);
        }
      }
      
      setInviteCodeChecking(true);
      try {
        console.log("🔍 [INVITE] Fetching referral status for wallet (cache miss):", paymentState.walletAddress);
        
        // Batch both requests simultaneously to reduce total time
        const [codeResponse, statusResponse] = await Promise.all([
          fetch(`https://backend-server-f82y.onrender.com/api/invite/check-code/${paymentState.walletAddress}`),
          fetch(`https://backend-server-f82y.onrender.com/api/invite/referral-status/${paymentState.walletAddress}`)
        ]);
        
        let inviteCode = null;
        let referralStatus = null;
        
        // Process invite code response
        if (codeResponse.ok) {
          const codeData = await codeResponse.json();
          if (codeData.code) {
            console.log("✅ [INVITE] Found invite code:", codeData.code);
            inviteCode = codeData.code;
            setAutoDetectedCode(codeData.code);
            setInviteCode(codeData.code);
          }
        }

        // Process referral status response
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          referralStatus = statusData;
          setReferralStatus(statusData);
          
          if (statusData.usedFriendCode) {
            setFriendReferralCode(statusData.usedFriendCode);
            setFriendCodeStatus('applied');
            console.log("🤝 [REFERRAL] User already referred by:", statusData.referrerWallet, "with code:", statusData.usedFriendCode);
          }
          
          console.log("📊 [REFERRAL] Full status:", statusData);
        }
        
        // 🚀 CACHE: Store the results for next time
        const dataToCache = {
          inviteCode,
          referralStatus,
          timestamp: Date.now()
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(dataToCache));
        console.log("💾 [INVITE] Cached referral data for future use");
        
      } catch (error) {
        console.warn("⚠️ [INVITE] Error checking referral status:", error.message);
      } finally {
        setInviteCodeChecking(false);
      }
    };

    // 🚀 DEBOUNCE: Prevent rapid successive calls
    const timeoutId = setTimeout(checkInviteCodeAndStatus, 300);
    return () => clearTimeout(timeoutId);
  }, [paymentState.walletAddress]);

  // 🤝 Function to apply friend's referral code
  const applyFriendReferralCode = async (friendCode) => {
    console.log("🤝 [FRIEND-CODE] Function called with code:", friendCode);
    
    if (!paymentState.walletAddress) {
      console.log("❌ [FRIEND-CODE] No wallet connected");
      setFriendCodeStatus('invalid');
      alert('Please connect your wallet first.');
      return { success: false, message: 'Please connect your wallet first.' };
    }

    if (!friendCode.trim()) {
      console.log("❌ [FRIEND-CODE] No code provided");
      setFriendCodeStatus('invalid');
      alert('Please enter a referral code.');
      return { success: false, message: 'Please enter a referral code.' };
    }

    try {
      console.log("🤝 [FRIEND-CODE] Applying friend's referral code:", friendCode);
      setFriendCodeStatus('checking'); // New status for loading
      
      const requestBody = {
        walletAddress: paymentState.walletAddress,
        friendCode: friendCode.trim().toUpperCase()
      };
      
      console.log("📤 [FRIEND-CODE] Sending request:", requestBody);
      
      const response = await fetch(`https://backend-server-f82y.onrender.com/api/invite/use-friend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log("📥 [FRIEND-CODE] Raw response status:", response.status);
      
      const data = await response.json();

      console.log("🔍 [FRIEND-CODE] Response:", response.status, data);
      console.log("🔍 [FRIEND-CODE] Response.ok:", response.ok);

      if (response.ok && data.success) {
        if (data.alreadyReferred) {
          setFriendCodeStatus('applied');
          console.log("ℹ️ [FRIEND-CODE] Already referred:", data.message);
          alert(`Success: ${data.message}`);
          return { success: true, message: data.message, alreadyReferred: true };
        } else {
          setFriendCodeStatus('applied');
          setFriendReferralCode(friendCode.trim().toUpperCase());
          console.log("✅ [FRIEND-CODE] Successfully applied:", data.message);
          alert(`Success: ${data.message}`);
          return { success: true, message: data.message };
        }
      } else {
        setFriendCodeStatus('invalid');
        console.error("❌ [FRIEND-CODE] Failed:", data);
        
        // Show specific error message from backend
        const errorMessage = data.message || data.error || 'Failed to apply referral code';
        alert(`Error: ${errorMessage}`);
        
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      setFriendCodeStatus('invalid');
      console.error("❌ [FRIEND-CODE] Error:", error.message);
      alert(`Network Error: ${error.message}`);
      return { success: false, message: 'Failed to apply referral code. Please try again.' };
    }
  };

  // 🚀 Transaction Handler
  const { handleBuy } = useHandleTransaction({
    selectedToken,
    selectedChain,
    amountPay: paymentState.safeAmountPay,
    pureBits: paymentState.pureBits,
    usdValue: paymentState.usdValue,
    pricePerBitsUSD: paymentState.pricePerBitsUSD,
    selectedTokenPrice: paymentState.selectedTokenPrice,
    walletAddress: paymentState.walletAddress,
    balances: paymentState.balances,
    availableBits: paymentState.availableBits,
    setTransactionHash,
    setConfirmedBits,
    setPopupVisible,
    setIsConfirmed,
    bonusAmount: paymentState.bonusAmount,
    selectedPaymentMethod: selectedPaymentMethod,
    inviteCode: inviteCode || (friendCodeStatus === 'applied' ? friendReferralCode : ''), // 🎁 Pass invite code or friend code to transaction
  });

  const handleClosePopup = () => {
    setPopupVisible(false);
    setTransactionHash(null);
    setConfirmedBits(null);
    setIsConfirmed(false);
  };

  // 💳 Check if we need to show payment method selector
  const isFiatToken = ['NOWPAY', 'MOONPAY', 'TRANSAK'].includes(selectedToken);
  const shouldShowSelector = isFiatToken && paymentState.safeAmountPay > 0;

  // 💳 Handle payment method selection
  const handlePaymentMethodSelect = (method) => {
    console.log("🎯 [PaymentBox] handlePaymentMethodSelect called with:", method);
    console.log("🎯 [PaymentBox] Current selectedPaymentMethod:", selectedPaymentMethod);
    console.log("🎯 [PaymentBox] Is final confirmation?:", selectedPaymentMethod && selectedPaymentMethod.id === method.id);
    
    // If this is the final confirmation (Continue button), proceed with payment
    if (selectedPaymentMethod && selectedPaymentMethod.id === method.id) {
      console.log("🎯 [PaymentBox] Final confirmation - hiding selector");
      setShowPaymentSelector(false); // Hide selector after final confirmation
      setSelectedPaymentMethod(method);
    } else {
      console.log("🎯 [PaymentBox] First selection - keeping selector visible");
      // First selection - just set the method, keep selector visible for confirmation
      setSelectedPaymentMethod(method);
    }
    
    console.log("🎯 [PaymentBox] After selection - selectedPaymentMethod will be:", method);
  };

  // 💳 Handle proceed to payment selection
  const handleProceedToPayment = () => {
    if (isFiatToken && paymentState.safeAmountPay > 0) {
      setShowPaymentSelector(true);
    }
  };

  // 🎯 Loading State
  if (paymentState.isLoading) {
    return (
      <div className="payment-box">
        <PaymentLoading 
          isLoading={paymentState.isLoading}
          transactionStep={paymentState.transactionStep}
          isProcessingTransaction={paymentState.isProcessingTransaction}
        />
      </div>
    );
  }

  return (
    <div className="payment-box">
      {/* 🎯 Transaction Popup */}
      <TransactionPopup
        visible={isPopupVisible}
        txHash={transactionHash}
        bits={confirmedBits}
        token={selectedToken}
        amount={paymentState.safeAmountPay}
        isConfirmed={isConfirmed}
        onClose={handleClosePopup}
      />

      {/* 🎯 Error Display */}
      <PaymentError 
        error={paymentState.transactionError}
        onRetry={() => paymentState.setTransactionError(null)}
      />

      {/* 🎯 Payment Title */}
      <PaymentTitle 
        selectedToken={selectedToken}
        selectedTokenIcon={paymentState.selectedTokenIcon}
      />

      {/* 🎯 Price Information */}
      <PriceInfo
        selectedToken={selectedToken}
        selectedTokenIcon={paymentState.selectedTokenIcon}
        pricePerBitsUSD={paymentState.pricePerBitsUSD}
        selectedTokenPrice={paymentState.selectedTokenPrice}
        bitsLoading={paymentState.isLoading}
        priceError={paymentState.priceError}
      />

      {/* 🎯 Input Box */}
      <InputBox
        amountPay={paymentState.safeAmountPay}
        setAmountPay={setAmountPay}
        userBalance={paymentState.balances[selectedToken] || 0}
        selectedToken={selectedToken}
      />

      {/* 🎯 Terms Acceptance Checkbox */}
      <div className="terms-checkbox-container">
        <label className="terms-checkbox-label">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="terms-checkbox"
          />
          <span className="checkbox-custom"></span>
          <span className="terms-text">
            I have read, understood, and agree to the 
            <a href="/terms" className="terms-link">Terms & Conditions</a> and 
            <a href="/privacy-policy" className="terms-link">Privacy Policy</a>
          </span>
        </label>
      </div>

      {/* 💳 Payment Method Selector */}
      {showPaymentSelector && (
        <PaymentMethodSelector
          onSelectMethod={handlePaymentMethodSelect}
          selectedMethod={selectedPaymentMethod}
          amount={paymentState.usdValue || paymentState.safeAmountPay}
          walletAddress={paymentState.walletAddress}
          isVisible={showPaymentSelector}
        />
      )}

      {/* 🎯 Action Buttons */}
      {!paymentState.walletAddress ? (
        <button onClick={paymentState.connectWallet} className="connect-wallet-button">
          Connect Wallet
        </button>
      ) : isFiatToken && !selectedPaymentMethod ? (
        <button 
          onClick={handleProceedToPayment} 
          className="buy-button"
          disabled={!paymentState.hasValidAmount || !termsAccepted}
        >
          <img src="/logo.png" alt="BITS Logo" className="button-logo" />
          <span className="button-text">Choose Payment Method</span>
        </button>
      ) : (
        <>
          <button 
            onClick={handleBuy} 
            disabled={!paymentState.canProceed || !termsAccepted}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '220px',
              margin: '15px auto',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: paymentState.canProceed && termsAccepted ? 'pointer' : 'not-allowed',
              color: '#ffffff',
              background: paymentState.canProceed && termsAccepted 
                ? '#007bff'
                : '#666666',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (paymentState.canProceed && termsAccepted) {
                e.target.style.background = '#0056b3';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (paymentState.canProceed && termsAccepted) {
                e.target.style.background = '#007bff';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <img 
              src="/logo.png" 
              alt="BITS Logo" 
              style={{
                width: '24px',
                height: '24px'
              }}
            />
            BUY $BITS NOW
          </button>
          
          {/* 🚨 Smart Warning Card - Only show when needed */}
          {(!paymentState.canProceed || !termsAccepted) && (
            <div className="payment-warning-card" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              margin: '10px auto',
              padding: '10px 15px',
              maxWidth: '300px',
              background: 'rgba(255, 107, 107, 0.05)',
              border: '1px solid rgba(255, 107, 107, 0.2)',
              borderRadius: '10px',
              backdropFilter: 'blur(5px)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#ff6b6b',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                ⚠️ Requirements Not Met
              </div>
              <div style={{
              fontSize: '0.8rem',
                color: 'rgba(255, 107, 107, 0.9)',
              lineHeight: '1.4'
            }}>
                {!paymentState.hasValidAmount && <div>• Amount must be greater than 0</div>}
                {!paymentState.hasValidBalance && !isFiatToken && <div>• Insufficient {selectedToken} balance</div>}
                {paymentState.isLoading && <div>• Loading payment data...</div>}
                {!termsAccepted && <div>• Accept Terms & Conditions</div>}
                {selectedToken === "SOL" && !window.solana && <div>• Install Phantom Wallet</div>}
              </div>
            </div>
          )}
        </>
      )}

      {/* 🎁 Invite Code Input Field */}
      <div className="invite-code-section" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '15px auto',
        padding: '10px 15px',
        maxWidth: '280px',
        background: 'rgba(0, 255, 195, 0.03)',
        border: '1px solid rgba(0, 255, 195, 0.15)',
        borderRadius: '10px',
        backdropFilter: 'blur(5px)'
      }}>
        <label style={{
          fontSize: '0.75rem',
          fontWeight: '500',
          color: autoDetectedCode ? '#00ffc3' : 'rgba(0, 255, 195, 0.7)',
          marginBottom: '6px',
          textAlign: 'center',
          letterSpacing: '0.5px'
        }}>
          🎁 {autoDetectedCode ? 'Referral Code (Auto-detected)' : 'Referral Code (Optional)'}
        </label>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder={autoDetectedCode ? autoDetectedCode : "Enter code"}
          style={{
            width: '100%',
            maxWidth: '180px',
            padding: '8px 12px',
            background: autoDetectedCode ? 'rgba(0, 255, 195, 0.08)' : 'rgba(0, 20, 30, 0.6)',
            border: `1px solid ${autoDetectedCode ? '#00ffc3' : 'rgba(0, 255, 195, 0.25)'}`,
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: '600',
            textAlign: 'center',
            outline: 'none',
            transition: 'all 0.3s ease',
            boxShadow: autoDetectedCode ? '0 0 8px rgba(0, 255, 195, 0.2)' : 'none'
          }}
          disabled={inviteCodeChecking}
        />
        {autoDetectedCode && (
          <div style={{
            marginTop: '4px',
            fontSize: '0.7rem',
            color: 'rgba(0, 255, 195, 0.8)',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            ✅ Found: {autoDetectedCode}
          </div>
        )}
        {inviteCode && inviteCode !== autoDetectedCode && (
          <div style={{
            marginTop: '4px',
            fontSize: '0.7rem',
            color: 'rgba(255, 179, 71, 0.9)',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            ✏️ Manual: {inviteCode}
          </div>
        )}
      </div>

      {/* 🤝 Friend's Referral Code Section - Show if user doesn't have a referrer yet OR for debugging */}
      {(paymentState.walletAddress && (!referralStatus?.hasReferrer || true)) && (
        <div className="friend-referral-section" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '15px auto',
          padding: '12px 15px',
          maxWidth: '280px',
          background: 'rgba(255, 179, 71, 0.03)',
          border: '1px solid rgba(255, 179, 71, 0.15)',
          borderRadius: '10px',
          backdropFilter: 'blur(5px)'
        }}>
          <label style={{
            fontSize: '0.75rem',
            fontWeight: '500',
            color: friendCodeStatus === 'applied' ? '#ffb347' : 'rgba(255, 179, 71, 0.7)',
            marginBottom: '6px',
            textAlign: 'center',
            letterSpacing: '0.5px'
          }}>
            🤝 Friend's Referral Code {referralStatus && `(Debug: hasReferrer=${referralStatus.hasReferrer})`}
          </label>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <input
              type="text"
              value={friendReferralCode}
              onChange={(e) => setFriendReferralCode(e.target.value.toUpperCase())}
              placeholder={`Enter friend's code (Status: ${friendCodeStatus || 'null'}, Checking: ${inviteCodeChecking})`}
              disabled={false} // Temporarily always enabled for testing
              style={{
                flex: 1,
                padding: '8px 12px',
                background: friendCodeStatus === 'applied' 
                  ? 'rgba(255, 179, 71, 0.08)' 
                  : 'rgba(30, 20, 0, 0.6)',
                border: `1px solid ${
                  friendCodeStatus === 'applied' ? '#ffb347' :
                  friendCodeStatus === 'invalid' ? '#ff6b6b' :
                  'rgba(255, 179, 71, 0.25)'
                }`,
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: '600',
                textAlign: 'center',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: friendCodeStatus === 'applied' ? '0 0 8px rgba(255, 179, 71, 0.2)' : 'none'
              }}
            />
            
            {friendCodeStatus !== 'applied' && (
              <button
                onClick={() => applyFriendReferralCode(friendReferralCode)}
                disabled={!friendReferralCode.trim()}
                style={{
                  padding: '8px 12px',
                  background: friendReferralCode.trim() ? '#ffb347' : '#666666',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000000',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: friendReferralCode.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
              >
                Apply
              </button>
            )}
          </div>

          {friendCodeStatus === 'applied' && (
            <div style={{
              marginTop: '4px',
              fontSize: '0.7rem',
              color: 'rgba(255, 179, 71, 0.8)',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              ✅ Applied: {friendReferralCode}
            </div>
          )}

          {friendCodeStatus === 'invalid' && (
            <div style={{
              marginTop: '4px',
              fontSize: '0.7rem',
              color: '#ff6b6b',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              ❌ Invalid or already used
            </div>
          )}
        </div>
      )}

      {/* 🎯 Payment Summary */}
      <PaymentSummary
        amountPay={paymentState.safeAmountPay}
        usdValue={paymentState.usdValue}
        pricePerBitsUSD={paymentState.pricePerBitsUSD}
        selectedTokenPrice={paymentState.selectedTokenPrice}
        pureBits={paymentState.pureBits}
        bonus={paymentState.bonus}
        bonusAmount={paymentState.bonusAmount}
        selectedToken={selectedToken}
      />

      {/* 🎯 Bonus Information */}
      <div className="bonus-line">
        <img src="/logo.png" alt="$BITS" className="token-title-icon" />
        <span className="bonus-label">Claimable Bonus:</span>
        <span className="bonus-value">{paymentState.bonusAmount} $BITS</span>
      </div>
      <div className="bonus-note">
        <span>Bonus tokens can be claimed later via the Rewards Dashboard</span>
      </div>

      {/* 🎯 Success Message */}
      {confirmedBits && (
        <div className="confirmed-success">
          ✅ You received <strong>{confirmedBits}</strong> $BITS successfully!
        </div>
      )}
    </div>
  );
};

export default PaymentBox;
