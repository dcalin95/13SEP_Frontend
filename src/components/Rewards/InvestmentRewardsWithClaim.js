import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../../abi/nodeABI.js";

const contractAddress = "0xe447db49E8e031d38c291E7e499c71a00aB80347";

const InvestmentRewardsWithClaim = () => {
  const [currentInvestment, setCurrentInvestment] = useState(0);
  const [totalTokensBought, setTotalTokensBought] = useState(0);
  const [nowWorth, setNowWorth] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            fetchInvestmentData(accounts[0]);
          }
        } catch (error) {
          console.error("Error connecting to wallet:", error);
        }
      } else {
        alert("MetaMask not detected. Please install it!");
      }
    };

    checkWalletConnection();
  }, []);

  const fetchInvestmentData = async (wallet) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const cellsCount = await contract.getCellsCount();
      let totalTokensWei = ethers.BigNumber.from(0);
      for (let i = 0; i < cellsCount; i++) {
        const funds = await contract.userFundsByCell(i, wallet);
        totalTokensWei = totalTokensWei.add(funds);
      }

      const totalTokensInBits = parseFloat(ethers.utils.formatUnits(totalTokensWei, 18));
      setTotalTokensBought(totalTokensInBits);

      const currentPriceInWei = await contract.getPrice(1);
      const currentPriceInUSD = parseFloat(ethers.utils.formatUnits(currentPriceInWei, 18));

      const worthInUSD = totalTokensInBits * currentPriceInUSD;
      setNowWorth(worthInUSD);

      const totalInvestmentInUSD = totalTokensInBits * currentPriceInUSD;
      setCurrentInvestment(totalInvestmentInUSD);
    } catch (error) {
      console.error("Error fetching investment data:", error);
    }
  };

  const claimReward = async () => {
    if (!isConnected || currentInvestment === 0) {
      alert("Connect your wallet and ensure you have investments to claim rewards.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.claimRefCode(
        [],
        "",
        Date.now() + 3600,
        0,
        ethers.constants.HashZero,
        ethers.constants.HashZero
      );
      await tx.wait();
      alert("Reward claimed successfully!");
    } catch (error) {
      console.error("Error claiming reward:", error);
      alert("Failed to claim reward. Check the contract or your wallet.");
    }
  };

  return (
    <div>
      <h4>Investment Rewards</h4>
      <p>Wallet Address: {walletAddress}</p>
      <p>Total Investment: ${currentInvestment.toFixed(2)}</p>
      <p>Total Tokens Bought: {totalTokensBought.toFixed(2)} $BITS</p>
      <p>Now worth: ${nowWorth.toFixed(2)} USD</p>
      <button
        onClick={claimReward}
        disabled={!isConnected || currentInvestment === 0}
        className="claim-button"
      >
        Claim Reward
      </button>
    </div>
  );
};

export const setAdditionalInfo = async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    const pricePerBITSInWei = await contract.getPrice(1);
    const pricePerBITSInUSD = parseFloat(ethers.utils.formatUnits(pricePerBITSInWei, 18));

    const limitFor5Percent = ethers.utils.parseUnits((250 / pricePerBITSInUSD).toString(), 18);
    const limitFor10Percent = ethers.utils.parseUnits((500 / pricePerBITSInUSD).toString(), 18);

    const percents = [500, 1000];
    const limits = [limitFor5Percent, limitFor10Percent];

    const tx = await contract.setAdditionalInfo(percents, limits);
    await tx.wait();

    alert("Additional rewards updated successfully!");
  } catch (error) {
    console.error("Error setting additional rewards:", error);
    alert("Failed to update rewards. Check console for details.");
  }
};

export const getAdditionalRewards = async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    const additionalRewards = await contract.getAdditionalRewardInfo();
    console.log("Additional rewards:", additionalRewards);
  } catch (error) {
    console.error("Error fetching additional rewards:", error);
  }
};

export default InvestmentRewardsWithClaim;


