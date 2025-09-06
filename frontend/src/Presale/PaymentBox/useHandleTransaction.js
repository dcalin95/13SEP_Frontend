import { ethers } from "ethers";
import { useCallback, useRef } from "react";
import { handlePayment } from "../TokenHandlers/TokenHandlerManager";

const useHandleTransaction = ({
  selectedToken,
  selectedChain,
  amountPay,
  pureBits,
  usdValue,
  pricePerBitsUSD,
  selectedTokenPrice,
  walletAddress,
  balances,
  availableBits,
  setTransactionHash,
  setConfirmedBits,
  setPopupVisible,
  setIsConfirmed,
  bonusAmount,
  selectedPaymentMethod,
  referralCode, // 🎯 Add referral code parameter
}) => {
  const confirmedOnce = useRef(false); // ✅ Evită dublarea confirmării

  const handleBuy = useCallback(async () => {
    console.groupCollapsed("🚀 [useHandleTransaction] START");
    console.log("🎯 [FULL DEBUG] Transaction Parameters:");
    console.log("- selectedToken:", selectedToken);
    console.log("- selectedPaymentMethod:", selectedPaymentMethod);
    console.log("- amountPay:", amountPay);
    console.log("- pureBits:", pureBits);
    console.log("- usdValue:", usdValue);
    console.log("- walletAddress:", walletAddress);
    console.log("- referralCode:", referralCode); // 🎯 Log referral code

    try {
      console.log("🎯 [STEP 2] Starting token mapping...");
      
      // 💳 Determine effective token for handler selection first
      const paymentMethodMapping = {
        'nowpayments': 'NOWPAY',
        'moonpay_widget': 'MOONPAY', 
        'transak_widget': 'TRANSAK'
      };
      
      console.log("🎯 [STEP 3] Payment method mapping created");
      
      const effectiveToken = selectedPaymentMethod 
        ? paymentMethodMapping[selectedPaymentMethod.id] || selectedPaymentMethod.id
        : selectedToken;
        
      console.log("🎯 [STEP 4] Effective token calculated:", effectiveToken);
      console.log("🎯 [EARLY DEBUG] Is fiat?:", ['MOONPAY', 'TRANSAK', 'NOWPAY'].includes(effectiveToken));

      // Skip wallet check for fiat payments
      const isFiatPayment = ['MOONPAY', 'TRANSAK', 'NOWPAY'].includes(effectiveToken);
      
      if (!walletAddress && !isFiatPayment) {
        const errorMsg = "⚠️ Please connect your wallet.";
        alert(errorMsg);
        console.warn("🚨 Wallet not connected.");
        console.groupEnd();
        return;
      }
      
      if (isFiatPayment) {
        console.log("💳 [FIAT] Fiat payment detected - skipping wallet check");
      }

      console.log("💰 Amount Pay (BNB):", amountPay);
      console.log("💰 User BNB Balance:", balances[selectedToken]);

      if (!Number.isFinite(amountPay) || amountPay <= 0) {
        console.error("❌ Invalid amountPay value:", amountPay);
        alert("Amount must be greater than 0.");
        console.groupEnd();
        return;
      }

      // 🌟 Different handling for Solana vs BSC/ETH tokens
      let amountToSend, gasBuffer;
      
      if (selectedToken === "SOL" || selectedToken === "USDC-Solana") {
        gasBuffer = 0.001; // Solana has much lower fees
        amountToSend = parseFloat(amountPay) + gasBuffer;
        console.log(`⛽ Estimated ${selectedToken} Fee Buffer:`, gasBuffer);
      } else {
        gasBuffer = 0.003; // BSC/ETH gas buffer
        amountToSend = parseFloat(amountPay) + gasBuffer;
        console.log("⛽ Estimated Gas Buffer (BNB/ETH):", gasBuffer);
      }

      console.log("🚀 Total to Send:", amountToSend, selectedToken);

      if (balances[selectedToken] < amountToSend) {
        alert(`⚠️ Not enough ${selectedToken} to cover the transaction.`);
        console.warn(`Insufficient ${selectedToken} balance.`);
        console.groupEnd();
        return;
      }

      console.log("🔍 [BITS DEBUG] Raw values:");
      console.log("- pureBits (raw):", pureBits, "type:", typeof pureBits);
      console.log("- bonusAmount (raw):", bonusAmount, "type:", typeof bonusAmount);
      console.log("- Number.isFinite(pureBits):", Number.isFinite(pureBits));
      console.log("- Number.isFinite(bonusAmount):", Number.isFinite(bonusAmount));

      const validPureBits = Number.isFinite(pureBits) ? pureBits : 0;
      const validBonusAmount = Number.isFinite(bonusAmount) && bonusAmount >= 0 ? bonusAmount : 0;
      const totalBits = validPureBits + validBonusAmount;

      console.log("🔍 [BITS DEBUG] Calculated values:");
      console.log("- validPureBits:", validPureBits);
      console.log("- validBonusAmount:", validBonusAmount);
      console.log("- totalBits:", totalBits);
      console.log("- totalBits <= 0:", totalBits <= 0);
      console.log("- !Number.isFinite(totalBits):", !Number.isFinite(totalBits));

      if (totalBits <= 0 || !Number.isFinite(totalBits)) {
        console.error("🚨 Invalid totalBits value:", totalBits);
        console.error("🚨 BITS calculation failed - check useBitsEstimate hook!");
        alert("Transaction failed: Invalid BITS value.");
        console.groupEnd();
        return;
      }

      let bitsBigNumber, amountToSendInWei;
      
      // Skip Wei conversions for fiat payments
      if (!isFiatPayment) {
        try {
          bitsBigNumber = ethers.utils.parseUnits(totalBits.toString(), 18);
          console.log("🛠️ bitsBigNumber (in WEI):", bitsBigNumber.toString());
        } catch (err) {
          console.error("❌ Error converting BITS to WEI:", err.message);
          alert("Transaction failed: Error processing BITS value.");
          console.groupEnd();
          return;
        }

        try {
          amountToSendInWei = ethers.utils.parseUnits(amountToSend.toString(), "ether");
          console.log("🛠️ amountToSend (in WEI):", amountToSendInWei.toString());
        } catch (err) {
          console.error("❌ Error converting BNB to WEI:", err.message);
          alert("Transaction failed: Error processing BNB value.");
          console.groupEnd();
          return;
        }
      } else {
        console.log("💳 [FIAT] Skipping Wei conversions for fiat payment");
        bitsBigNumber = totalBits; // Use raw number for fiat
        amountToSendInWei = amountToSend; // Use raw amount for fiat
      }

      console.log("🚀 Transaction Parameters:");
      console.log("Token:", selectedToken);
      console.log("Amount in WEI:", amountToSendInWei.toString());
      console.log("BITS to Receive (WEI):", bitsBigNumber.toString());
      console.log("USD Value:", usdValue);

      // Use effectiveToken from early calculation
        
      console.log("🎯 [CRITICAL DEBUG] Payment Method Resolution:");
      console.log("- selectedToken:", selectedToken);
      console.log("- selectedPaymentMethod:", selectedPaymentMethod);
      console.log("- effectiveToken (FINAL):", effectiveToken);
      
      const handler = handlePayment(effectiveToken);
      console.log("🎯 [HANDLER DEBUG] Handler Info:");
      console.log("- handler function:", handler);
      console.log("- handler name:", handler.name);
      console.log("- is fiat payment?:", ['MOONPAY', 'TRANSAK', 'NOWPAY'].includes(effectiveToken));
      
      let txResult;
      let txHash;

      try {
        // 🌟 Special handling for fiat payment methods
        if (['MOONPAY', 'TRANSAK', 'NOWPAY'].includes(effectiveToken)) {
          txResult = await handler({
            amount: usdValue || amountPay, // USD amount for fiat
            bitsToReceive: totalBits,
            walletAddress,
            usdInvested: Math.floor(usdValue),
            bonusAmount: validBonusAmount,
            bonusPercentage: validBonusAmount > 0 ? 5 : 0,
            referralCode: referralCode, // 🎯 Add referral code
            onStatusUpdate: (status) => {
              console.log(`💳 Payment status update: ${status}`);
            }
          });
        }
        // 🌟 Special handling for SOL payments
        else if (selectedToken === "SOL") {
          txResult = await handler({
            amount: amountPay, // SOL amount (not in Wei)
            bitsToReceive: totalBits, // BITS amount (not in Wei)
            walletAddress,
            selectedChain,
            usdInvested: Math.floor(usdValue),
            bonusAmount: validBonusAmount,
            bonusPercentage: validBonusAmount > 0 ? 5 : 0,
            fallbackBitsPrice: pricePerBitsUSD,
            referralCode: referralCode, // 🎯 Add referral code
          });
        } else {
          txResult = await handler({
            amount: amountToSendInWei.toString(),
            bitsToReceive: bitsBigNumber.toString(),
            walletAddress,
            selectedChain,
            usdInvested: Math.floor(usdValue),
            bonusAmount: validBonusAmount,
            bonusPercentage: validBonusAmount > 0 ? 5 : 0,
            fallbackBitsPrice: pricePerBitsUSD, // ✅ inclus acum corect
            referralCode: referralCode, // 🎯 Add referral code
          });
        }

        txHash = typeof txResult === "string" ? txResult : txResult?.txHash;

        if (txHash) {
          console.log("✅ Transaction Submitted. Hash:", txHash);

          if (typeof setPopupVisible === "function") setPopupVisible(true);

          // 🌟 Different confirmation logic for Solana vs ETH/BSC
          if (selectedToken === "SOL" || selectedToken === "USDC-Solana") {
            // For Solana tokens, the transaction is already confirmed in handler
            if (!confirmedOnce.current) {
              confirmedOnce.current = true;
              console.log(`✅ ${selectedToken} Transaction Confirmed:`, txHash);

              if (typeof setTransactionHash === "function") setTransactionHash(txHash);
              if (typeof setConfirmedBits === "function") setConfirmedBits(totalBits);
              if (typeof setIsConfirmed === "function") setIsConfirmed(true);
            }
          } else {
            // For ETH/BSC, wait for blockchain confirmation
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const receipt = await provider.waitForTransaction(txHash);

            if (receipt.status === 1 && !confirmedOnce.current) {
              confirmedOnce.current = true;
              console.log("✅ Transaction Confirmed:", txHash);

              if (typeof setTransactionHash === "function") setTransactionHash(txHash);
              if (typeof setConfirmedBits === "function") setConfirmedBits(totalBits);
              if (typeof setIsConfirmed === "function") setIsConfirmed(true);
            } else {
              console.warn("❌ Transaction Failed on-chain:", txHash);
              alert("Transaction failed on blockchain.");
            }
          }
        }

      } catch (handlerError) {
        console.error("❌ [HANDLER ERROR] Full Handler Error Details:");
        console.error("- Handler error message:", handlerError.message);
        console.error("- Handler error stack:", handlerError.stack);
        console.error("- Handler error object:", handlerError);
        console.error("- effectiveToken when handler error:", effectiveToken);
        console.error("- handler function when error:", handler);
        console.error("- selectedPaymentMethod when handler error:", selectedPaymentMethod);
        
        alert("Transaction failed: " + handlerError.message);
      }

    } catch (err) {
      console.error("❌ [GENERAL ERROR] Full General Error Details:");
      console.error("- General error message:", err.message);
      console.error("- General error stack:", err.stack);
      console.error("- General error object:", err);
      console.error("- selectedToken when general error:", selectedToken);
      console.error("- selectedPaymentMethod when general error:", selectedPaymentMethod);
      
      alert("Transaction failed: " + err.message);
    } finally {
      console.groupEnd();
    }
  }, [
    selectedToken,
    selectedChain,
    amountPay,
    pureBits,
    usdValue,
    pricePerBitsUSD,
    selectedTokenPrice,
    walletAddress,
    balances,
    availableBits,
    setTransactionHash,
    setConfirmedBits,
    setPopupVisible,
    bonusAmount,
    setIsConfirmed,
  ]);

  return { handleBuy };
};

export default useHandleTransaction;
