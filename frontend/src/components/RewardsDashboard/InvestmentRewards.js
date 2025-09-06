import React, { useEffect, useState, useContext } from "react";
import { ethers } from "ethers";
import WalletContext from "../../context/WalletContext";
import contractABI from "../../abi/nodeABI.js";
import "./InvestmentRewards.css";

const contractAddress = "0xA2AeEb08262EaA44D6f5A6b29Ddaf2F4378FDC2B";

const InvestmentRewards = () => {
  const { walletAddress, connectWallet } = useContext(WalletContext);
  const [totalInvestmentUSD, setTotalInvestmentUSD] = useState("0.00");
  const [totalBitsBought, setTotalBitsBought] = useState("0.00");
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [totalBonus, setTotalBonus] = useState("0.00");
  const [currentCell, setCurrentCell] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchInvestmentData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!walletAddress) {
        throw new Error("Wallet is not connected. Please connect your wallet.");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const currentCellIndex = await contract.getCurrentCell();
      setCurrentCell(currentCellIndex.toString());

      const cellsCount = await contract.getCellsCount();
      let totalUSD = 0;
      let totalBITS = 0;
      let totalBonusAccumulated = 0;
      let transactionCounter = 0;

      for (let i = 0; i < cellsCount; i++) {
        const userFundsWei = await contract.userFundsByCell(i, walletAddress);
        const userFundsBITS = parseFloat(ethers.utils.formatUnits(userFundsWei, 18));

        if (userFundsBITS > 0) {
          transactionCounter++;
          const cellData = await contract.getCell(i);
          const priceInWei = ethers.BigNumber.from(cellData.sPrice);
          const price = parseFloat(ethers.utils.formatUnits(priceInWei, 18));

          totalBITS += userFundsBITS;
          totalUSD += userFundsBITS * price;

          const bonus = userFundsBITS >= 200 ? userFundsBITS * 0.1 : userFundsBITS >= 100 ? userFundsBITS * 0.05 : 0;
          totalBonusAccumulated += bonus;
        }
      }

      setTotalInvestmentUSD(totalUSD.toFixed(2));
      setTotalBitsBought(totalBITS.toFixed(2));
      setTransactionsCount(transactionCounter);
      setTotalBonus(totalBonusAccumulated.toFixed(2));
    } catch (error) {
      console.error("Error fetching investment data:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchInvestmentData();
    }
  }, [walletAddress]);

  return (
    <div className="investment-rewards-container">
      <h2 className="section-title">Investment Rewards</h2>
      {!walletAddress ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : loading ? (
        <div className="loading">
          <p>Loading investment data...</p>
        </div>
      ) : (
        <>
          <p className="wallet-label">Wallet Address:</p>
          <p className="wallet-address">{walletAddress}</p>

          <p>Total Investment: <span className="amount usd">${totalInvestmentUSD} USD</span></p>
          <p>Total $BITS Bought: <span className="amount bits">{totalBitsBought} $BITS</span></p>
          <p>Number of Transactions: <span className="amount">{transactionsCount}</span></p>
          <p>Total Bonus Earned: <span className="amount bits">{totalBonus} $BITS</span></p>
          <p>Current Open Cell: <span className="amount eth">{currentCell !== null ? currentCell : "N/A"}</span></p>

          <button onClick={fetchInvestmentData} style={{ marginTop: "10px" }}>
            Refresh Data
          </button>

          {error && (
            <p className="error">
              <strong>Error:</strong> {error}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default InvestmentRewards;


