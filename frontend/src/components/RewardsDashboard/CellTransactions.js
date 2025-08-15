import React, { useEffect, useState, useContext } from "react";
import { ethers } from "ethers";
import WalletContext from "../../context/WalletContext"; // Import WalletContext
import contractABI from "../../abi/nodeABI.js";

const contractAddress = "0xA2AeEb08262EaA44D6f5A6b29Ddaf2F4378FDC2B";

const CellTransactions = () => {
  const { walletAddress } = useContext(WalletContext); // Accesăm WalletContext
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch cell data
  const fetchCells = async () => {
    if (!walletAddress) {
      setError("Wallet not connected. Please connect your wallet.");
      return;
    }

    if (!window.ethereum) {
      setError("Ethereum provider not detected. Please install MetaMask.");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const cellsCountBN = await contract.getCellsCount();
      const cellsCount = cellsCountBN.toNumber();

      const promises = Array.from({ length: cellsCount }, (_, i) => contract.getCell(i));
      const cellsData = await Promise.all(promises);

      const formattedCells = cellsData.map((cell, i) => ({
        id: i,
        state: cell.cellState.toString() === "1" ? "Open" : "Closed",
        supply: parseFloat(cell.supply.toString()),
        sold: parseFloat(ethers.utils.formatUnits(cell.sold || "0", 18)),
        priceUSD: parseFloat(ethers.utils.formatUnits(cell.sPrice || "0", 18)) * 1500, // Assuming ETH/USD rate
        transactionValue: parseFloat(ethers.utils.formatUnits(cell.sold || "0", 18)) * parseFloat(ethers.utils.formatUnits(cell.sPrice || "0", 18)) * 1500, // Assuming ETH/USD rate
      }));

      setCells(formattedCells);
    } catch (err) {
      console.error("Error fetching cell data:", err);
      setError("Failed to fetch cell data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) fetchCells();
  }, [walletAddress]);

  return (
    <div className="cell-transactions-page">
      <h2 className="cell-transactions-title">Cell Transactions</h2>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p className="loading-message">Loading transactions...</p>
      ) : cells.length > 0 ? (
        <div className="cells-grid">
          {cells.map((cell) => (
            <div
              key={cell.id}
              className={`cell-card ${cell.state === "Open" ? "open" : "closed"}`}
            >
              <h3>Cell ID: {cell.id}</h3>
              <p>
                <span>Status:</span> {cell.state}
              </p>
              <p>
                <span>Supply:</span> {cell.supply.toLocaleString()} BITS
              </p>
              <p>
                <span>Sold:</span> {cell.sold.toLocaleString()} BITS
              </p>
              <p>
                <span>Price (USD):</span> ${cell.priceUSD.toFixed(2)}
              </p>
              <p>
                <span>Transaction Value:</span> ${cell.transactionValue.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-transactions-message">No transactions found.</p>
      )}
    </div>
  );
};

export default CellTransactions;


