// src/Presale/TokenHandlers/handleSOLPayment.js

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";

const SOLANA_NETWORK = "https://api.devnet.solana.com";
const DESTINATION_WALLET = new PublicKey("63u6aWZJdFd1vh6VfCya5DJkXTUEmHBbs14SiqHNt4GQ");

const handleSOLPayment = async ({ amount, bitsToReceive, walletAddress }) => {
  try {
    console.log("🟣 [handleSOLPayment] Start SOL payment...");

    if (!window.solana || !window.solana.isPhantom) {
      throw new Error("⚠️ Phantom Wallet not detected.");
    }

    // 🔥 Conectăm Phantom (dacă nu e conectat deja)
    const connection = new Connection(SOLANA_NETWORK, "confirmed");
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
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // 🔥 Semnăm tranzacția
    const signedTx = await window.solana.signTransaction(tx);
    console.log("✍️ Transaction signed");

    // 🔥 Trimitem tranzacția pe rețea
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    console.log("📤 Transaction submitted:", signature);

    // 🔥 Așteptăm confirmarea
    await connection.confirmTransaction(signature, "confirmed");
    console.log("✅ Transaction confirmed on chain:", signature);

    // 🔥 Trimitem informația către backend
    const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
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
