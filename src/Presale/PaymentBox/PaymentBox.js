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
            className="buy-button"
            disabled={!paymentState.canProceed || !termsAccepted}
          >
            <img src="/logo.png" alt="BITS Logo" className="button-logo" />
            <span className="button-text">BUY  $BITS  NOW</span>
          </button>
          
          {/* 🚨 Debug Info - ALWAYS SHOW for debugging */}
          {(true) && (
            <div className="button-debug-info" style={{
              fontSize: '0.8rem',
              color: '#ff6b6b',
              marginTop: '8px',
              padding: '12px',
              background: 'rgba(255, 107, 107, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              textAlign: 'center',
              minWidth: 'fit-content',
              maxWidth: '100%',
              wordWrap: 'break-word',
              lineHeight: '1.4'
            }}>
              <div>🚨 Button disabled because:</div>
              {!paymentState.hasValidAmount && <div>• Invalid amount: {paymentState.safeAmountPay}</div>}
              {!paymentState.hasValidBalance && !isFiatToken && <div>• Insufficient balance: {paymentState.balances[selectedToken] || 0} {selectedToken}</div>}
              {isFiatToken && <div>• ✅ Fiat payment - no crypto balance required</div>}
              {paymentState.isLoading && <div>• Loading data...</div>}
              {!termsAccepted && <div>• Terms & Conditions not accepted</div>}
              {selectedToken === "SOL" && !window.solana && <div>• Phantom Wallet not detected (install Phantom)</div>}
              

            </div>
          )}
        </>
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
