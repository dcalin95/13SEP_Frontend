import { ethers } from "ethers";
import axios from "axios";
import { CONTRACTS } from "../../contract/contracts";

const API_ENDPOINT = process.env.REACT_APP_API_URL + "/transactions";

const handleETHPayment = async ({
  amount,
  bitsToReceive,
  walletAddress,
  selectedChain,
  usdInvested,
  bonusAmount = 0,
  bonusPercentage = 0,
  fallbackBitsPrice = 1.0,
}) => {
  console.groupCollapsed("🚀 [handleETHPayment] START");

  try {
    if (!window.ethereum) throw new Error("No Web3 wallet detected.");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // 🔄 Convert ETH amount to BNB equivalent for Node contract
    const amountInWei = ethers.utils.parseUnits(amount.toString(), "ether");

    const nodeAbi = [
      "function setCellState(address user, address token, uint256 amount, uint256 bitsToReceive, bytes extraData, uint256 uintData, uint256 extraUint) external",
      "function getBitsBalance() view returns (uint256)",
    ];

    const cellManagerAbi = [
      "function getCurrentOpenCellId() view returns (uint256)",
      "function getPriceForAmount(uint256 cellId, uint256 amount) view returns (uint256)",
      "function checkBNBPrice() view returns (uint256)"
    ];

    const nodeContract = new ethers.Contract(CONTRACTS.NODE.address, nodeAbi, signer);
    const cellManager = new ethers.Contract(CONTRACTS.CELL_MANAGER.address, cellManagerAbi, signer);

    const cellId = await cellManager.getCurrentOpenCellId();
    console.log("📦 Current Open Cell ID:", cellId);

    const bitsAvailable = await nodeContract.getBitsBalance();
    console.log("📦 Available BITS in Node:", bitsAvailable.toString());

    const bitsToReceiveBN = ethers.BigNumber.from(bitsToReceive);
    console.log("🧮 Bits to Receive (Units):", bitsToReceiveBN.toString());
    console.log("💸 Amount in Wei to Send:", amountInWei.toString());

    if (bitsToReceiveBN.isZero() || bitsToReceiveBN.lte(0)) {
      throw new Error("Invalid bitsToReceive value.");
    }

    if (bitsAvailable.lt(bitsToReceiveBN)) {
      throw new Error("Insufficient BITS in Node contract.");
    }

    // Get BNB price for conversion
    const bnbPriceRaw = await cellManager.checkBNBPrice();
    const bnbPrice = parseFloat(bnbPriceRaw.toString()) / 1e18;
    console.log("💰 BNB Price from contract:", bnbPrice);

    // Convert ETH amount to USD then to BNB equivalent
    // Use usdInvested from parameters (calculated from real price in frontend)
    const usdValueETH = usdInvested || (parseFloat(amount) * 3600); // Fallback price
    const bnbEquivalent = usdValueETH / bnbPrice;
    const bnbEquivalentWei = ethers.utils.parseEther(bnbEquivalent.toString());

    console.log("💰 ETH Amount:", amount);
    console.log("💵 USD Value:", usdValueETH);
    console.log("💰 BNB Equivalent:", bnbEquivalent);

    console.log("📦 Final BITS Price in USD (fallback only):", fallbackBitsPrice);

    console.log("🚀 Initiating ETH Transaction via Node Contract...");

    // Get ETH token address from tokenData
    const ETH_TOKEN_ADDRESS = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"; // ETH on BSC

    // First transfer ETH to receiver
    const transferTx = await signer.sendTransaction({
      to: CONTRACTS.ETH_RECEIVER.address,
      value: amountInWei,
    });

    console.log("⏳ ETH Transfer TX sent:", transferTx.hash);
    const transferReceipt = await transferTx.wait();
    console.log("✅ ETH Transfer confirmed:", transferReceipt.transactionHash);

    // Then call setCellState for BITS allocation
    const setCellTx = await nodeContract.setCellState(
      walletAddress,
      ETH_TOKEN_ADDRESS,
      bnbEquivalentWei, // BNB equivalent amount for calculation
      bitsToReceive,
      "0x", // empty extraData
      0,    // uintData
      0     // extraUint
    );

    const setCellReceipt = await setCellTx.wait();
    console.log("✅ SetCellState confirmed:", setCellReceipt.transactionHash);

    // 🎁 Bonus Logic
    try {
      const additionalReward = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      const usdInWei = ethers.utils.parseUnits(usdInvested.toString(), 18);
      console.log("💵 USD Investment for bonus:", usdInWei.toString());

      const bonusTx = await additionalReward.makeInvestment(usdInWei);
      await bonusTx.wait();
      console.log("🎁 Bonus investment recorded!");
    } catch (bonusErr) {
      console.warn("⚠️ Bonus investment failed:", bonusErr.message);
    }

    // 💾 Backend Integration
    try {
      const transactionData = {
        wallet_address: walletAddress,
        amount: usdInvested,
        type: "buy_bits",
        status: "confirmed",
        error_message: null,
        network: "EVM",
        bits_received: bitsToReceiveBN.toString(),
        bonus_percentage: bonusPercentage.toString(),
        bonus_bits: bonusAmount.toString(),
        tx_signature: setCellReceipt.transactionHash,
      };

      console.log("💾 Sending ETH transaction to backend:", transactionData);

      const response = await axios.post(API_ENDPOINT, transactionData);
      console.log("✅ ETH Transaction saved in backend:", response.data);

    } catch (err) {
      console.warn("⚠️ Error saving ETH transaction in backend:", err.message);
    }

    return { txHash: setCellReceipt.transactionHash };

  } catch (err) {
    console.error("❌ Error in handleETHPayment:", err.message);

    // 💾 Log failed transaction
    try {
      const failedTransaction = {
        wallet_address: walletAddress,
        amount: usdInvested,
        type: "buy_bits",
        status: "failed",
        error_message: err.message,
        network: "EVM",
        bits_received: "0",
        bonus_percentage: "0",
        bonus_bits: "0",
        tx_signature: null,
      };

      console.log("💾 Logging failed ETH transaction:", failedTransaction);
      await axios.post(API_ENDPOINT, failedTransaction);

    } catch (logError) {
      console.warn("⚠️ Error logging failed ETH transaction:", logError.message);
    }

    throw err;

  } finally {
    console.groupEnd();
  }
};

export default handleETHPayment;
