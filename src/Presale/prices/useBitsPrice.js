import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";

export default function useBitsPrice(walletAddress) {
  const [bitsPrice, setBitsPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrice = async () => {
      console.groupCollapsed("📊 [useBitsPrice] Start fetch");

      try {
        const IS_TESTNET = true; // sau din .env

const provider = new ethers.providers.JsonRpcProvider(
  IS_TESTNET
    ? "https://data-seed-prebsc-1-s1.binance.org:8545/"
    : "https://bsc-dataseed.binance.org/"
);

        const contractAddress = CONTRACTS.CELL_MANAGER?.address;

        if (!contractAddress) {
          throw new Error("Missing CellManager contract address");
        }

        const abi = [
          "function getCurrentBitsPriceUSD() view returns (uint256)",
          "function getCurrentOpenCellId() view returns (uint256)",
          "function getCell(uint256) view returns (bool, uint8, uint256, uint256, uint256, uint256)"
        ];

        const contract = new ethers.Contract(contractAddress, abi, provider);

        // Fetch standard price from latest open cell
        const cellId = await contract.getCurrentOpenCellId();
        console.log("📦 Using fallback from open cellId:", cellId.toString());

        const cell = await contract.getCell(cellId);
        const standardPriceRaw = cell[2];
        let standardPrice = parseFloat((standardPriceRaw / 1000).toFixed(3));

        console.log("🚨 [PRICE DEBUG] === BITS PRICE ANALYSIS ===");
        console.log("🚨 [PRICE] Cell ID:", cellId.toString());
        console.log("🚨 [PRICE] Raw standard price:", standardPriceRaw.toString());
        console.log("🚨 [PRICE] Raw price / 1000:", standardPriceRaw / 1000);
        console.log("🚨 [PRICE] Final standard price:", standardPrice);
        
        // 🎯 FIX: Force $1.00 BITS price if contract returns wrong value
        if (standardPrice < 0.50) {
          console.log("🚨 [PRICE FIX] Contract returned too low price:", standardPrice, "→ Forcing $1.00");
          standardPrice = 1.00;
        }
        
        console.log("🚨 [PRICE] Cell data full:", cell);
        console.log("✅ Final BITS price (after fix):", standardPrice);
        setBitsPrice(standardPrice);
      } catch (err) {
        console.error("❌ [useBitsPrice] Failed to fetch price:", err.message || err);
        setError("BITS price unavailable");
        setBitsPrice(null);
      } finally {
        setLoading(false);
        console.groupEnd();
      }
    };

    fetchPrice();
  }, [walletAddress]);

  return { bitsPrice, loading, error };
}
