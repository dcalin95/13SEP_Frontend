import React, { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import WalletContext from "../../context/WalletContext";
import ReferralRewards from "./ReferralRewards";
import InvestmentRewards from "./InvestmentRewards";
import InvitedUsers from "./InvitedUsers";
import CellTransactions from "./CellTransactions";
import WalletInfo from "./WalletInfo";
import TransactionHistory from "../Rewards/TransactionHistory";
import DirectPay from "../Rewards/DirectPay";
import "./RewardsDashboard.css";
import contractABI from "../../abi/nodeABI.js";

const contractAddress = "0xe447db49E8e031d38c291E7e499c71a00aB80347";

const RewardsDashboard = () => {
  const { walletAddress } = useContext(WalletContext);
  const [cells, setCells] = useState([]);
  const [openCell, setOpenCell] = useState(null);

  const fetchData = async () => {
    if (!walletAddress) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const cellsCountBN = await contract.getCellsCount();
      const cellsCount = cellsCountBN.toNumber();

      const promises = Array.from({ length: cellsCount }, (_, i) => contract.getCell(i));
      const cellResults = await Promise.all(promises);

      const cellsData = cellResults.map((cell, i) => ({
        id: i,
        state: cell.cellState.toString(),
        supply: parseFloat(ethers.utils.formatUnits(cell.supply || "0", 18)),
        sold: parseFloat(ethers.utils.formatUnits(cell.sold || "0", 18)),
        sPrice: parseFloat(ethers.utils.formatUnits(cell.sPrice || "0", 18)),
      }));

      const openCellData = cellsData.find((cell) => cell.state === "1");

      setCells(cellsData);
      setOpenCell(openCellData || null);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchData();
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <div style={{ padding: "2rem", color: "#fff", textAlign: "center", background: "#111" }}>
        <h2>🔐 Wallet not connected</h2>
        <p>Please connect your wallet to access the Rewards Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="rewards-dashboard" style={{ background: "#111", padding: "2rem", color: "#0ff" }}>
      <h2 className="dashboard-title">🎯 Rewards Dashboard</h2>

      <div className="dashboard-container">
        <div className="dashboard-row">
          <div className="dashboard-card">
            <h4>Wallet Info</h4>
            <WalletInfo />
          </div>
          <div className="dashboard-card">
            <h4>Cell Transactions</h4>
            <CellTransactions cells={cells} />
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-card">
            <h4>Referral Rewards</h4>
            <ReferralRewards walletAddress={walletAddress} />
          </div>
          <div className="dashboard-card">
            <h4>Investment Rewards</h4>
            <InvestmentRewards />
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-card">
            <h4>Transaction History</h4>
            <TransactionHistory />
          </div>
          <div className="dashboard-card">
            <h4>Direct Pay + Invited Users</h4>
            <DirectPay />
            <InvitedUsers walletAddress={walletAddress} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsDashboard;
