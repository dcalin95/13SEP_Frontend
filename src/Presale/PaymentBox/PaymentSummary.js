import React, { useEffect, useState, useContext } from "react";
import "./PaymentSummary.css";
import { FaDollarSign, FaCoins, FaGift, FaStar, FaGem } from "react-icons/fa";
import { getContractInstance } from "../../contract/getContractInstance";
import { ethers } from "ethers";
import WalletContext from "../../context/WalletContext";

const PaymentSummary = ({ amountPay, usdValue, pureBits, bonusAmount, selectedToken, bonus }) => {
  const { walletAddress } = useContext(WalletContext);
  const [bonusPercentage, setBonusPercentage] = useState("No Bonus");
  const [totalInvestment, setTotalInvestment] = useState(0);

  useEffect(() => {
    console.log("🎁 [PaymentSummary] Bonus calculation:", {
      bonus,
      bonusAmount,
      pureBits,
      walletAddress
    });

    // 🎯 FIX: Use bonus parameter directly from useBitsEstimate
    if (bonus && bonus > 0) {
      setBonusPercentage(`${bonus}%`);
      console.log("✅ [PaymentSummary] Using bonus from useBitsEstimate:", bonus);
    } else if (parseFloat(bonusAmount) > 0 && parseFloat(pureBits) > 0) {
      // Fallback: calculate from amounts
      const estimatedPercent = (parseFloat(bonusAmount) / parseFloat(pureBits)) * 100;
      setBonusPercentage(`${estimatedPercent.toFixed(0)}%`);
      console.log("🔄 [PaymentSummary] Calculated bonus from amounts:", estimatedPercent);
    } else {
      setBonusPercentage("No Bonus");
      console.log("❌ [PaymentSummary] No bonus available");
    }
  }, [bonus, bonusAmount, pureBits, walletAddress]);

  const formattedAmountPay = parseFloat(amountPay).toFixed(2);
  const formattedUsdValue = parseFloat(usdValue).toFixed(2);
  // 🎯 FIX: Contract sends INTEGER BITS only, no decimals
  const formattedPureBits = Math.floor(parseFloat(pureBits)).toString();
  const formattedBonusAmount = Math.floor(parseFloat(bonusAmount)).toString();
  const formattedTotalBits = (Math.floor(parseFloat(pureBits)) + Math.floor(parseFloat(bonusAmount))).toString();

  return (
    <div className="payment-summary">
      <div className="summary-line hover-effect" translate="no">
        <span className="summary-label">
          <FaDollarSign className="icon icon-pay" /> YOU PAY:
        </span>
        <span className="summary-value highlight-bnb">
          ≈ ${formattedAmountPay} {selectedToken || 'BNB'} ≈ ${formattedUsdValue}
        </span>
      </div>

      <div className="summary-line hover-effect" translate="no">
        <span className="summary-label">
          <FaCoins className="icon icon-receive" /> YOU RECEIVE:
        </span>
        <span className="summary-value bits-gradient">
          {formattedPureBits} $BITS
        </span>
      </div>

      <div className="summary-line hover-effect" translate="no">
        <span className="summary-label">
          <FaGift className="icon icon-percentage" /> Bonus Percentage:
        </span>
        <span className="summary-value bonus-gradient">
          {bonusPercentage}
        </span>
      </div>

      <div className="summary-line hover-effect" translate="no">
        <span className="summary-label">
          <FaStar className="icon icon-tokens" /> Bonus Tokens:
        </span>
        <span className="summary-value bonus-highlight">
          {formattedBonusAmount} $BITS
        </span>
      </div>

      <div className="summary-line hover-effect" translate="no">
        <span className="summary-label">
          <FaGem className="icon icon-total-now" /> Total BITS (Now):
        </span>
        <span className="summary-value bits-gradient">
          {formattedPureBits} $BITS
        </span>
      </div>

      <div className="summary-line total-bits hover-effect" translate="no">
        <span className="summary-label">
          <FaGem className="icon icon-total-including" /> Total BITS (Including Bonus):
        </span>
        <span className="summary-value bits-gradient pulse">
          {formattedTotalBits} $BITS
        </span>
      </div>

             <div className="legal-disclaimer-container">
         <span className="legal-disclaimer-text">
           By proceeding with this purchase, you acknowledge that you have read, understood, and agree to our 
           <a href="/terms" className="legal-link">Terms & Conditions</a> and 
           <a href="/privacy-policy" className="legal-link">Privacy Policy</a>. 
           Cryptocurrency investments carry inherent risks including market volatility, regulatory changes, and potential loss of funds. 
           You confirm that you are of legal age and have the authority to make this investment decision. 
           This agreement is governed by the laws of the Republic of Seychelles, and any disputes shall be resolved in the courts of the Republic of Seychelles.
         </span>
       </div>
    </div>
  );
};

export default PaymentSummary;
