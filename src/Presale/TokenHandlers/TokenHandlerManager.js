// src/Presale/TokenHandlers/TokenHandlerManager.js

import { tokenList } from "./tokenData";
import handleGenericPayment from "./handleGenericPayment";
import handleNowPayments from "./handleNowPayments";


import handleBNBPayment from "./handleBNBPayment";
import handleETHPayment from "./handleETHPayment";
import handleUSDTPayment from "./handleUSDTPayment";
import handleUSDCPayment from "./handleUSDCPayment";
import handleMATICPayment from "./handleMATICPayment";
import handleSHIBPayment from "./handleSHIBPayment";
import handleSOLPayment from "./handleSOLPayment";
// DEPRECATED: Solana payment handlers removed due to inactive contracts
// import handleUSDCOnSolanaPayment from "./handleUSDCOnSolanaPayment";
// import handleSolanaPayment from "./handleSolanaPayment";
// Coming Soon - waiting for Seychelles company registration
import handleMoonPayPayment from "./handleMoonPayPayment";
import handleTransakPayment from "./handleTransakPayment";


/**
 * Returnează funcția corectă pentru procesarea plății în funcție de tokenul selectat.
 * Dacă nu găsește un handler specific, folosește fallback-ul generic.
 */
export const handlePayment = (tokenSymbol) => {
  const token = tokenList.find((t) => t.key === tokenSymbol);
  if (!token) return handleGenericPayment;

  const handlerMap = {
    BNB: handleBNBPayment,
    ETH: handleETHPayment,
    USDT: handleUSDTPayment,
    USDC: handleUSDCPayment,
    MATIC: handleMATICPayment,
    SHIB: handleSHIBPayment,
    SOL: handleSOLPayment, // SOL pe Solana
    // DEPRECATED: Solana payment handlers removed due to inactive contracts
    // "USDC-Solana": handleUSDCOnSolanaPayment,
    // SOLANA: handleSolanaPayment,
    NOWPAY: handleNowPayments,
    // Coming Soon - waiting for Seychelles company registration
    MOONPAY: handleMoonPayPayment,
    TRANSAK: handleTransakPayment,
  };

  const handler = handlerMap[token.key] || handleGenericPayment;

  // 🟡 DEBUG: vezi ce handler e ales
  console.log(`🧩 [TokenHandlerManager] Handler selected for ${tokenSymbol}: ${handler.name}`);

  return handler;
};
