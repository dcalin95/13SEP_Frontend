import React, { useEffect, useState, useContext } from "react";
import "./PaymentSummary.css";
import { FaDollarSign, FaCoins, FaGift, FaStar, FaGem } from "react-icons/fa";
import { getContractInstance } from "../../contract/getContractInstance";
import { ethers } from "ethers";
import WalletContext from "../../context/WalletContext";

const PaymentSummary = ({ amountPay, usdValue, pureBits, bonusAmount, selectedToken }) => {
  const { walletAddress } = useContext(WalletContext);
  const [bonusPercentage, setBonusPercentage] = useState("No Bonus");
  const [totalInvestment, setTotalInvestment] = useState(0);

  useEffect(() => {
    const calculateTotalInvestment = async (address) => {
      try {
        const nodeContract = await getContractInstance("NODE");
        const rewardContract = await getContractInstance("ADDITIONAL_REWARD");

        const userPurchases = await nodeContract.getUserPurchases(address);
        let totalInvestmentUSD = 0n;

        userPurchases.forEach((purchase) => {
          const parsedUSD = ethers.utils.parseUnits(purchase.usdAmount.toString(), 18);
          totalInvestmentUSD = totalInvestmentUSD.add(parsedUSD);
        });

        const adjustedInvestment = await rewardContract.getTotalInvestment(address);
        totalInvestmentUSD = totalInvestmentUSD.add(adjustedInvestment);

        const totalInvestmentEther = ethers.utils.formatUnits(totalInvestmentUSD, 18);
        setTotalInvestment(totalInvestmentEther);

        const percentageBN = await rewardContract.getRewardRate(totalInvestmentUSD);
        const percentage = Number(percentageBN.toString());

        // 🔍 DEBUG LOGS
        console.log("🧮 totalInvestmentUSD (wei):", totalInvestmentUSD.toString());
        console.log("💸 totalInvestmentUSD (ether):", totalInvestmentEther);
        console.log("📨 getRewardRate input (BN):", totalInvestmentUSD.toString());
        console.log("📊 getRewardRate return:", percentage);

        if ([5, 7, 10, 15].includes(percentage)) {
          setBonusPercentage(`${percentage}%`);
        } else {
          setBonusPercentage("No Bonus");
        }

      } catch (error) {
        console.error("❌ Error calculating total investment and bonus percentage:", error);
        setBonusPercentage("No Bonus");
      }
    };

    if (!walletAddress) {
      if (parseFloat(pureBits) > 0 && parseFloat(bonusAmount) > 0) {
        const estimatedPercent = (parseFloat(bonusAmount) / parseFloat(pureBits)) * 100;
        setBonusPercentage(`${estimatedPercent.toFixed(0)}% (est.)`);
      } else {
        setBonusPercentage("No Bonus");
      }
      return;
    }

    calculateTotalInvestment(walletAddress);
  }, [walletAddress, pureBits, bonusAmount]);

  const formattedAmountPay = parseFloat(amountPay).toFixed(2);
  const formattedUsdValue = parseFloat(usdValue).toFixed(2);
  const formattedPureBits = parseFloat(pureBits).toFixed(2);
  const formattedBonusAmount = parseFloat(bonusAmount).toFixed(2);
  const formattedTotalBits = (parseFloat(formattedPureBits) + parseFloat(formattedBonusAmount)).toFixed(2);

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
