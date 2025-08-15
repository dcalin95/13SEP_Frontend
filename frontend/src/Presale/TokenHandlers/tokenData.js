// src/Presale/TokenHandlers/tokenData.js
import bnb from "../../assets/icons/bnb.logo.png";
import eth from "../../assets/icons/evm-logo.jpg";
import usdt from "../../assets/icons/tether-usdt-logo.png";
import usdc from "../../assets/icons/usdc-solana-logo.png";
import sol from "../../assets/icons/solana-logo.png";
import matic from "../../assets/icons/polygon-matic-logo.png";
import shib from "../../assets/icons/shiba-logo.png";
import usdcSolana from "../../assets/icons/usdc-solana-logo.png";
import cardIcon from "../../assets/icons/card-logo.jpg";

// ✅ Folosește adresele reale din CONTRACTS.js (hardcoded aici temporar, pune-le și acolo)
export const tokenList = [
  {
    name: "BNB",
    key: "BNB",
    icon: bnb,
    color: "#f3ba2f",
    chain: "evm",
    address: "0x0000000000000000000000000000000000000000", // Native token
  },
  
  {
    name: "ETH",
    key: "ETH",
    icon: eth,
    color: "#627eea",
    chain: "evm",
    address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // ETH on BSC
  },
  {
    name: "USDT",
    key: "USDT",
    icon: usdt,
    color: "#26a17b",
    chain: "evm",
    address: "0x55d398326f99059fF775485246999027B3197955", // USDT on BSC
  },
  {
    name: "USDC",
    key: "USDC",
    icon: usdc,
    color: "#2775ca",
    chain: "evm",
    address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC on BSC
  },
  {
    name: "SOL",
    key: "SOL",
    icon: sol,
    color: "#66f9e2",
    chain: "solana",
    address: null, // Not supported on EVM
  },
  {
    name: "MATIC",
    key: "MATIC",
    icon: matic,
    color: "#8247e5",
    chain: "evm",
    address: "0xcc42724c6683b7e57334c4e856f4c9965ed682bd", // MATIC on BSC
  },
  {
    name: "SHIB",
    key: "SHIB",
    icon: shib,
    color: "#f4551e",
    chain: "evm",
    address: "0x285A5B8B5A94B052A26ecA7BdA54e8F345d1ab32", // SHIB on BSC (example)
  },
  {
    name: "USDC-Solana",
    key: "USDC-Solana",
    icon: usdcSolana,
    color: "#2775ca",
    chain: "solana",
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mainnet mint
    decimals: 6
  },
  // Fiat payments - Coming Soon (waiting for Seychelles company registration)
  {
    name: "Card Payment (NOWPayments)",
    key: "NOWPAY",
    icon: cardIcon,
    color: "#444",
    chain: "fiat",
    address: null,
    comingSoon: true,
    requiresCompany: true,
  },
  {
    name: "MoonPay (Credit Card)",
    key: "MOONPAY",
    icon: cardIcon,
    color: "#7B68EE",
    chain: "fiat",
    address: null,
    comingSoon: true,
    requiresCompany: true,
  },
  {
    name: "Transak (Bank Transfer)",
    key: "TRANSAK", 
    icon: cardIcon,
    color: "#4285F4",
    chain: "fiat",
    address: null,
    comingSoon: true,
    requiresCompany: true,
  },
];

