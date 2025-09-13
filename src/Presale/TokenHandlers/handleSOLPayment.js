// src/Presale/TokenHandlers/handleSOLPayment.js

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";

const SOLANA_NETWORK = process.env.REACT_APP_SOL_RPC_HTTP || "https://api.devnet.solana.com";
const SOLANA_WS = process.env.REACT_APP_SOL_RPC_WS || "wss://api.devnet.solana.com";
const DESTINATION_WALLET = new PublicKey("63u6aWZJdFd1vh6VfCya5DJkXTUEmHBbs14SiqHNt4GQ");

const handleSOLPayment = async ({ amount, bitsToReceive, walletAddress }) => {
  try {
    console.log("🟣 [handleSOLPayment] Start SOL payment...");

    if (!window.solana || !window.solana.isPhantom) {
      throw new Error("⚠️ Phantom Wallet not detected.");
    }

    // 🔥 Conectăm Phantom (dacă nu e conectat deja)
    const connection = new Connection(SOLANA_NETWORK, { commitment: "confirmed", wsEndpoint: SOLANA_WS });
    const { publicKey } = await window.solana.connect();
    console.log("👛 Phantom publicKey:", publicKey.toBase58());

    // 🔥 Calculăm suma în lamports (1 SOL = 10^9 lamports)
    const lamports = Math.floor(amount * 1e9);
    console.log("💸 Lamports to send:", lamports);

    // 🔥 Creăm tranzacția de transfer
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: DESTINATION_WALLET,
        lamports,
      })
    );

    tx.feePayer = publicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    // 🔥 Semnăm tranzacția
    const signedTx = await window.solana.signTransaction(tx);
    console.log("✍️ Transaction signed");

    // 🔥 Trimitem tranzacția pe rețea (cu retry & fără skipPreflight)
    const rawTx = signedTx.serialize();
    const signature = await connection.sendRawTransaction(rawTx, { skipPreflight: false, maxRetries: 5 });
    console.log("📤 Transaction submitted:", signature);

    // 🔥 Confirmare robustă (noua semnătură confirmTransaction + fallback polling)
    try {
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      console.log("✅ Transaction confirmed on chain:", signature);
    } catch (e) {
      console.warn("⏳ confirmTransaction timed out, falling back to polling statuses...");
      const start = Date.now();
      const timeoutMs = 90000; // 90s fallback
      while (Date.now() - start < timeoutMs) {
        const st = await connection.getSignatureStatuses([signature]);
        const status = st?.value?.[0];
        if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
          console.log("✅ Transaction confirmed via polling:", signature);
          break;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // 🔥 Trimitem informația către backend (INCLUDE USD FOR LOYALTY BONUS)
    const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
    
    // 🎁 Calculate USD value for loyalty bonus (estimate based on SOL price)
    const estimatedSOLPrice = 150; // Fallback SOL price - should be updated from real price feed
    const usdInvested = amount * estimatedSOLPrice;
    
    console.log("🎁 [SOL LOYALTY] Estimated USD investment for bonus:", usdInvested);
    
    const response = await fetch(`${backendURL}/api/solana/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userWallet: publicKey.toBase58(),
        amount,
        bitsReceived: Number(bitsToReceive),
        signature,
        type: "SOL",
        network: "Solana",
        bonusPercentage: 0,
        bonusBits: 0,
        // 🎁 CRITICAL: Add USD investment for cross-chain loyalty bonus processing
        usdInvested: usdInvested,
        loyaltyEligible: true,
        note: "SOL payment - requires backend cross-chain processing for AdditionalReward.sol",
      }),
    });

    if (response.ok) {
      console.log("💾 Transaction saved to backend successfully.");
    } else {
      console.warn("⚠️ Failed to save transaction to backend.");
    }

    return signature;
  } catch (err) {
    console.error("❌ [handleSOLPayment] Error:", err);
    alert("❌ SOL payment failed: " + err.message);
    throw err;
  }
};

export default handleSOLPayment;
