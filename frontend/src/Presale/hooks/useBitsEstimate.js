import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";
import nodeABI from "../../abi/nodeABI";

const useBitsEstimate = ({ amountPay, selectedToken, tokenPriceUSD, walletAddress, pricePerBitsUSD }) => {
  const [bits, setBits] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const estimate = async () => {
      console.group("📊 [useBitsEstimate] Debug Start");
      setError(null);

      if (!amountPay || isNaN(amountPay) || amountPay <= 0 || !selectedToken) {
        console.warn("⚠️ Missing or invalid amount/token");
        setBits(0);
        setUsdValue(0);
        setBonus(0);
        setBonusAmount(0);
        console.groupEnd();
        return;
      }

      try {
        // 🌟 Special handling for Fiat tokens - treat amount as USD directly
        if (selectedToken === "NOWPAY" || selectedToken === "TRANSAK" || selectedToken === "MOONPAY") {
          const usdCalculated = parseFloat(amountPay); // Amount is already in USD for fiat
          const bitsPrice = pricePerBitsUSD || 0.04; // Use actual BITS price or fallback
          const bitsAmount = usdCalculated / bitsPrice;
          
          // Simple bonus calculation for fiat payments
          const bonusPercent = usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
          const bonusAmountCalc = Math.floor(bitsAmount * (bonusPercent / 100));
          const finalBits = bitsAmount + bonusAmountCalc;

          console.log(`💳 [${selectedToken} FIAT Calculation]`);
          console.log(`Amount USD:`, amountPay);
          console.log("USD Value:", usdCalculated);
          console.log("BITS Price USD:", bitsPrice);
          console.log("BITS Amount:", bitsAmount);
          console.log("Bonus %:", bonusPercent);
          console.log("Final BITS:", finalBits);

          // Validation
          if (isNaN(finalBits) || finalBits <= 0) {
            console.error("❌ Invalid BITS calculation for fiat");
            setError("Invalid BITS calculation");
            console.groupEnd();
            return;
          }

          setBits(finalBits);
          setUsdValue(usdCalculated);
          setBonus(bonusPercent);
          setBonusAmount(bonusAmountCalc);
          console.groupEnd();
          return;
        }
        
        // 🌟 Special handling for Solana tokens - direct calculation without BSC contracts
        else if (selectedToken === "SOL" || selectedToken === "USDC-Solana") {
          const usdCalculated = parseFloat(amountPay) * tokenPriceUSD;
          const bitsPrice = pricePerBitsUSD || 0.04; // Use actual BITS price or fallback
          const bitsAmount = usdCalculated / bitsPrice;
          
          // Simple bonus calculation for Solana tokens
          const bonusPercent = usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
          const bonusAmountCalc = Math.floor(bitsAmount * (bonusPercent / 100));
          const finalBits = bitsAmount + bonusAmountCalc;

          console.log(`🟣 [${selectedToken} BITS Calculation]`);
          console.log(`Amount ${selectedToken}:`, amountPay);
          console.log(`${selectedToken} Price USD:`, tokenPriceUSD);
          console.log("USD Value:", usdCalculated);
          console.log("BITS Price USD:", bitsPrice);
          console.log("BITS Amount:", bitsAmount);
          console.log("Bonus %:", bonusPercent);
          console.log("Final BITS:", finalBits);

          // Validation
          if (isNaN(finalBits) || finalBits <= 0) {
            console.error(`❌ Invalid BITS calculation for ${selectedToken}`);
            setError("Invalid BITS calculation");
            return;
          }

          setUsdValue(usdCalculated);
          setBonus(bonusPercent);
          setBits(Math.floor(finalBits));
          setBonusAmount(bonusAmountCalc);
          console.groupEnd();
          return;
        }

        // 🔗 BSC/ETH contract-based calculation - Use stable RPC for reads
        const rpcEndpoints = [
          "https://data-seed-prebsc-1-s1.binance.org:8545/",
          "https://data-seed-prebsc-2-s1.binance.org:8545/",
          "https://data-seed-prebsc-1-s2.binance.org:8545/",
          "https://bsc-testnet.publicnode.com",
          "https://bsc-testnet-rpc.publicnode.com"
        ];
        
        let provider = null;
        let rpcError = null;
        
        // Try multiple RPC endpoints for stability
        for (const rpcUrl of rpcEndpoints) {
          try {
            console.log("🌐 [RPC] Trying endpoint:", rpcUrl);
            provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            
            // Test the connection with a simple call
            await provider.getBlockNumber();
            console.log("✅ [RPC] Successfully connected to:", rpcUrl);
            break;
          } catch (rpcErr) {
            console.warn("⚠️ [RPC] Failed endpoint:", rpcUrl, rpcErr.message);
            rpcError = rpcErr;
            provider = null;
          }
        }
        
        if (!provider) {
          console.error("❌ [RPC] All endpoints failed, falling back to MetaMask");
          // Fallback to MetaMask if all RPC endpoints fail
          if (window.ethereum) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
          } else {
            throw new Error("No provider available - all RPC endpoints failed and MetaMask not detected");
          }
        }

        const abi = [
          "function getCurrentOpenCellId() view returns (uint256)",
          "function getExpectedBITSFromBNB(uint256, uint256, address) view returns (uint256)",
          "function checkBNBPrice() view returns (uint256)",
          "function getAdditionalRewardInfo() view returns (tuple(uint256 percent, uint256 limit)[])"
        ];

        const cellManager = new ethers.Contract(CONTRACTS.CELL_MANAGER.address, abi, provider);
        const nodeContract = new ethers.Contract(CONTRACTS.NODE.address, nodeABI, provider);

        console.log("🟡 [CONTRACTS] Cell Manager address:", CONTRACTS.CELL_MANAGER.address);
        console.log("🟡 [CONTRACTS] Node address:", CONTRACTS.NODE.address);
        
        const cellId = await cellManager.getCurrentOpenCellId();
        console.log("🟡 [CONTRACTS] Current cell ID:", cellId.toString());
        
        const amountInWei = ethers.utils.parseEther(amountPay.toString());
        console.log("🟡 [CONTRACTS] Amount in Wei:", amountInWei.toString());

        let bitsAmount = 0;
        let usdCalculated = parseFloat(amountPay) * tokenPriceUSD;

        if (selectedToken === "BNB") {
          console.log("🟡 [BNB] Calling cellManager.getExpectedBITSFromBNB...");
          console.log("- cellId:", cellId.toString());
          console.log("- amountInWei:", amountInWei.toString());
          console.log("- walletAddress:", walletAddress || ethers.constants.AddressZero);
          
          const rawBits = await cellManager.getExpectedBITSFromBNB(
            cellId,
            amountInWei,
            walletAddress || ethers.constants.AddressZero
          );
          
          console.log("🟡 [BNB] Raw BITS result:", rawBits.toString());
          bitsAmount = parseFloat(ethers.utils.formatUnits(rawBits, 18));
          console.log("🟡 [BNB] Formatted BITS amount:", bitsAmount);
        } else {
          const bnbPriceRaw = await cellManager.checkBNBPrice();
          const bnbPrice = parseFloat(bnbPriceRaw.toString()) / 1e18;

          usdCalculated = parseFloat(amountPay) * tokenPriceUSD;
          const bnbEquivalent = usdCalculated / bnbPrice;
          const bnbEquivalentWei = ethers.utils.parseEther(bnbEquivalent.toString());

          const rawBits = await cellManager.getExpectedBITSFromBNB(
            cellId,
            bnbEquivalentWei,
            walletAddress || ethers.constants.AddressZero
          );
          bitsAmount = parseFloat(ethers.utils.formatUnits(rawBits, 18));
        }

        console.log("🟡 [BONUS] Getting reward info from nodeContract...");
        const rewardRaw = await nodeContract.getAdditionalRewardInfo();
        const rewardTiers = rewardRaw.map((r) => ({
          percent: parseFloat(r.percent.toString()),
          limit: parseFloat(ethers.utils.formatUnits(r.limit, 18))
        }));
        console.log("🟡 [BONUS] Reward tiers:", rewardTiers);

        const applicableTier = rewardTiers.reverse().find((tier) => usdCalculated >= tier.limit);
        const bonusPercent = applicableTier ? applicableTier.percent : 0;
        console.log("🟡 [BONUS] USD calculated:", usdCalculated);
        console.log("🟡 [BONUS] Applicable tier:", applicableTier);
        console.log("🟡 [BONUS] Bonus percent:", bonusPercent);

        const rawBonusAmount = bitsAmount * (bonusPercent / 100);
        const bonusAmountCalc = Math.floor(rawBonusAmount);
        const finalBits = bitsAmount + bonusAmountCalc;
        
        console.log("🟡 [FINAL] BITS amount:", bitsAmount);
        console.log("🟡 [FINAL] Bonus amount calc:", bonusAmountCalc);
        console.log("🟡 [FINAL] Final BITS:", finalBits);

        setUsdValue(usdCalculated);
        setBonus(bonusPercent);
        setBits(Math.floor(finalBits));
        setBonusAmount(bonusAmountCalc);
      } catch (err) {
        console.error("❌ [useBitsEstimate] BLOCKCHAIN ERROR Details:");
        console.error("- Error message:", err.message || err);
        console.error("- Error code:", err.code);
        console.error("- Error data:", err.data);
        console.error("- Full error object:", err);
        console.error("- Stack trace:", err.stack);
        console.error("- selectedToken was:", selectedToken);
        console.error("- amountPay was:", amountPay);
        console.error("- Contract addresses:");
        console.error("  - CELL_MANAGER:", CONTRACTS?.CELL_MANAGER?.address);
        console.error("  - NODE:", CONTRACTS?.NODE?.address);
        
        console.warn("🔄 [FALLBACK] Blockchain failed, using fallback calculation...");
        
        // 🚨 FALLBACK CALCULATION - Simple USD-based calculation
        try {
          const usdCalculated = parseFloat(amountPay) * tokenPriceUSD;
          const bitsPrice = pricePerBitsUSD || 0.04; // Fallback BITS price
          const bitsAmount = usdCalculated / bitsPrice;
          
          // Simple bonus calculation
          const bonusPercent = usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
          const bonusAmountCalc = Math.floor(bitsAmount * (bonusPercent / 100));
          const finalBits = bitsAmount + bonusAmountCalc;

          console.log(`🔄 [FALLBACK] ${selectedToken} Calculation:`);
          console.log("- Amount:", amountPay);
          console.log("- Token Price USD:", tokenPriceUSD);
          console.log("- USD Value:", usdCalculated);
          console.log("- BITS Price:", bitsPrice);
          console.log("- BITS Amount:", bitsAmount);
          console.log("- Bonus %:", bonusPercent);
          console.log("- Final BITS:", finalBits);

          if (isNaN(finalBits) || finalBits <= 0) {
            console.error("❌ Fallback calculation also failed");
            setError("Failed to calculate BITS");
            setBits(0);
            setUsdValue(0);
            setBonus(0);
            setBonusAmount(0);
            return;
          }

          setUsdValue(usdCalculated);
          setBonus(bonusPercent);
          setBits(Math.floor(finalBits));
          setBonusAmount(bonusAmountCalc);
          setError(null); // Clear error since fallback worked
          
          console.log("✅ [FALLBACK] Calculation successful");
        } catch (fallbackErr) {
          console.error("❌ [FALLBACK] Even fallback failed:", fallbackErr);
          setError(err.message || "Failed to calculate BITS");
          setBits(0);
          setUsdValue(0);
          setBonus(0);
          setBonusAmount(0);
        }
      }

      console.groupEnd();
    };

    estimate();
  }, [amountPay, selectedToken, tokenPriceUSD, walletAddress]);

  return { bits, usdValue, bonus, bonusAmount, error };
};

export default useBitsEstimate;
