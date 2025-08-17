import { ethers } from "ethers";
import { getContractInstance } from "../../contract/getContract";
import { CONTRACTS } from "../../contract/contracts";
import ERC20ABI from "../../abi/erc20ABI.js";

const handleGenericPayment = async ({
  amount,
  bitsToReceive,
  walletAddress,
  signer,
  paymentTokenAddress,
  decimals = 18,
}) => {
  try {
    console.log("🔁 Generic Payment Handler started");

    const nodeContract = await getContractInstance("NODE");

    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
    const bitsInWei = ethers.utils.parseUnits(bitsToReceive.toString(), 18);

    console.log("Token:", paymentTokenAddress);
    console.log("Pay:", amountInWei.toString(), "| Receive:", bitsInWei.toString());

    // Approve ERC20 token dacă nu e token nativ
    if (paymentTokenAddress !== ethers.constants.AddressZero) {
      const tokenContract = new ethers.Contract(paymentTokenAddress, ERC20ABI, signer);
      console.log("Approving ERC20...");
      const approveTx = await tokenContract.approve(nodeContract.address, amountInWei);
      await approveTx.wait();
      console.log("✅ Approved");
    }

    // Executează plata
    const tx = await nodeContract.setCellState(
      walletAddress,
      paymentTokenAddress,
      amountInWei,
      bitsInWei,
      "",
      0,
      0,
      { value: paymentTokenAddress === ethers.constants.AddressZero ? amountInWei : 0 }
    );

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed:", receipt.transactionHash);

    // 🎁 Bonus: calculează valoare reală USD pe baza contractului CellManager
    try {
      const additionalReward = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      const cellManager = new ethers.Contract(
        CONTRACTS.CELL_MANAGER.address,
        [
          "function getCurrentOpenCellId() view returns (uint256)",
          "function getPriceForAmount(uint256, uint256) view returns (uint256)"
        ],
        signer
      );

      const cellId = await cellManager.getCurrentOpenCellId();
      const usdInWei = await cellManager.getPriceForAmount(cellId, bitsInWei);

      console.log("💵 makeInvestment → USD (wei):", usdInWei.toString());
      const bonusTx = await additionalReward.makeInvestment(usdInWei);
      await bonusTx.wait();
      console.log("🎁 Bonus investment recorded!");
    } catch (bonusErr) {
      console.warn("⚠️ Bonus investment failed:", bonusErr.message);
    }

    return receipt.transactionHash;
  } catch (error) {
    console.error("❌ Generic Payment Failed:", error);
    alert(`Generic token payment failed: ${error.message}`);
    throw error;
  }
};

export default handleGenericPayment;
