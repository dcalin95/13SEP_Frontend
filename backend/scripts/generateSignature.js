require("dotenv").config();
const { ethers } = require("ethers");

// Configurări globale din .env
const privateKey = process.env.PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;
const chainId = parseInt(process.env.CHAIN_ID || 97); // Default: Binance Smart Chain Testnet

// Date pentru semnătură
const referralCode = "REF1";
const receiver = process.env.RECEIVER_ADDRESS || "0x4CCA7bf2aeF7A432d06513f7b02c2F316E21f408";
const deadline = Math.floor(Date.now() / 1000) + 3600; // Valabil timp de 1 oră
const tokens = ["0x0000000000000000000000000000000000000000"]; // Adrese tokenuri

const generateSignature = async () => {
  try {
    if (!privateKey || !contractAddress || !receiver) {
      throw new Error("Lipsește o configurație importantă în fișierul .env.");
    }

    const wallet = new ethers.Wallet(privateKey);
    const domain = {
      name: "Node",
      version: "1",
      chainId: chainId,
      verifyingContract: contractAddress,
    };
    const types = {
      ClaimRefCode: [
        { name: "tokens", type: "address[]" },
        { name: "referralCode", type: "string" },
        { name: "receiver", type: "address" },
        { name: "deadline", type: "uint256" },
      ],
    };
    const value = { tokens: tokens, referralCode: referralCode, receiver: receiver, deadline: deadline };

    const signature = await wallet._signTypedData(domain, types, value);
    const { v, r, s } = ethers.utils.splitSignature(signature);

    console.log("Generated Signature:");
    console.log("v:", v);
    console.log("r:", r);
    console.log("s:", s);
    console.log("Deadline:", deadline);
  } catch (error) {
    console.error("Error generating signature:", error);
  }
};

generateSignature();
