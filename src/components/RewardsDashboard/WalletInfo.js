import React, { useContext, useEffect, useState } from "react";
import WalletContext from "../../context/WalletContext";
import { ethers } from "ethers";
import "./WalletInfo.css";

const WalletInfo = () => {
  const {
    walletAddress,
    network,
    tokens,
    connectWallet,
    disconnectWallet,
    loading,
  } = useContext(WalletContext);

  const [balances, setBalances] = useState([]);
  const [networkName, setNetworkName] = useState("");

  useEffect(() => {
    const fetchNetworkName = async () => {
      if (!window.ethereum) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const { chainId } = await provider.getNetwork();

      const networks = {
        1: "Ethereum Mainnet",
        56: "Binance Smart Chain",
        97: "Binance Smart Chain Testnet",
      };
      setNetworkName(networks[chainId] || `Chain ID: ${chainId}`);
    };

    const fetchBalances = async () => {
      if (!walletAddress) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balanceBNB = await provider.getBalance(walletAddress);
      const formattedBNB = ethers.utils.formatEther(balanceBNB);

      const tokenBalances = [
        { name: "BNB", amount: formattedBNB },
        { name: "$BITS", amount: "647552.02" },
      ];

      setBalances(tokenBalances);
    };

    fetchNetworkName();
    fetchBalances();
  }, [walletAddress]);

  return (
    <div className="wallet-info-card">
      {!walletAddress ? (
        <button className="connect-button" onClick={connectWallet}>
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        <div className="wallet-info-details">
          <h3 className="wallet-title">Wallet Information</h3>
          <p>
            <strong>Network:</strong>{" "}
            <span className="highlighted-value">{networkName}</span>
          </p>
          <p>
            <strong>Wallet Address:</strong>{" "}
            <span className="wallet-address">{walletAddress}</span>
          </p>
          <div className="wallet-balances">
            <h4>Balances:</h4>
            <ul>
              {balances.map((token, index) => (
                <li key={index} className="balance-item">
                  <strong>{token.name}:</strong>{" "}
                  <span className="highlighted-value">{token.amount}</span>
                </li>
              ))}
            </ul>
          </div>
          <button className="disconnect-button" onClick={disconnectWallet}>
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletInfo;

