// src/Presale/hooks/useBNBRequiredForBits.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";

const useBNBRequiredForBits = (bitsDesired, walletAddress) => {
  const [bnbRequired, setBnbRequired] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [bonusPercent, setBonusPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEstimation = async () => {
      setLoading(true);
      setError(null);

      try {
        if (
          !bitsDesired ||
          isNaN(bitsDesired) ||
          bitsDesired <= 0 ||
          !walletAddress
        ) {
          setBnbRequired(0);
          setUsdValue(0);
          setBonusPercent(0);
          return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const cellManagerAbi = [
          "function getCurrentOpenCellId() view returns (uint256)",
          "function getCurrentOpenCellPrice(address wallet) view returns (uint256)",
          "function getPriceForAmount(uint256 cellId, uint256 amount) view returns (uint256)"
        ];
        const cellManager = new ethers.Contract(
          CONTRACTS.CELL_MANAGER.address,
          cellManagerAbi,
          provider
        );

        const cellId = await cellManager.getCurrentOpenCellId();

        // 🧾 Prețul total în BNB (wei)
        const priceInWei = await cellManager.getPriceForAmount(
          cellId,
          ethers.utils.parseUnits(bitsDesired.toString(), 18)
        );

        const bitsPriceRaw = await cellManager.getCurrentOpenCellPrice(walletAddress); // USD * 1000
        const bitsPriceUSD = parseFloat(bitsPriceRaw.toString()) / 1000;

        const usdTotal = bitsDesired * bitsPriceUSD;

        // 🔥 Bonus logic
        const bonus =
          usdTotal >= 2500 ? 15 :
          usdTotal >= 1000 ? 10 :
          usdTotal >= 500 ? 7 :
          usdTotal >= 250 ? 5 : 0;

        const adjustedBits = bitsDesired / (1 + bonus / 100); // eliminăm bonusul
        const usdPay = adjustedBits * bitsPriceUSD;

        const bnbAmount = parseFloat(ethers.utils.formatEther(priceInWei));

        setBnbRequired(bnbAmount);
        setUsdValue(parseFloat(usdPay.toFixed(2)));
        setBonusPercent(bonus);
      } catch (err) {
        console.error("❌ [useBNBRequiredForBits] error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEstimation();
  }, [bitsDesired, walletAddress]);

  return {
    bnbRequired,
    usdValue,
    bonusPercent,
    loading,
    error
  };
};

export default useBNBRequiredForBits;
