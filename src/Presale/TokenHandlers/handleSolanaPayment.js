import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
/* global BigInt */


import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";

// Devnet info
const SOLANA_RPC = "https://api.devnet.solana.com";
const USDC_MINT = new PublicKey("HBUpnm43PjQdWJoFFLeUWbG8raduosdkmz8tg1C4mvGT");
const DESTINATION_WALLET = new PublicKey("63u6aWZJdFd1vh6VfCya5DJkXTUEmHBbs14SiqHNt4GQ");

const handleUSDCOnSolanaPayment = async ({
  amount,
  bitsToReceive,
  walletAddress,
}) => {
  try {
    console.log("💳 USDC (SPL) transfer started...");

    if (!window.solana || !window.solana.isPhantom) {
      throw new Error("Phantom wallet is not available.");
    }

    const connection = new Connection(SOLANA_RPC, "confirmed");
    const { publicKey } = await window.solana.connect();

    const fromATA = await getAssociatedTokenAddress(
      USDC_MINT,
      publicKey
    );

    const toATA = await getAssociatedTokenAddress(
      USDC_MINT,
      DESTINATION_WALLET
    );

    const decimals = 9; // ← conform tokenului tău
    const amountInUnits = BigInt(Math.floor(amount * 10 ** decimals)); // safe conversion

    const tx = new Transaction().add(
      createTransferInstruction(
        fromATA,
        toATA,
        publicKey,
        amountInUnits,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    tx.feePayer = publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signed = await window.solana.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(sig, "confirmed");

    console.log("✅ USDC Transfer TX:", sig);

    // 🔁 Trimite la backend
    const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
    await fetch(`${backendURL}/api/solana/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txHash: sig,
        amount,
        from: publicKey.toBase58(),
        to: DESTINATION_WALLET.toBase58(),
        bitsToReceive,
        type: "USDC-Solana",
        network: "Solana",
      }),
    });

    return sig;
  } catch (err) {
    console.error("❌ USDC on Solana error:", err);
    alert("USDC payment failed: " + err.message);
    throw err;
  }
};

export default handleUSDCOnSolanaPayment;
