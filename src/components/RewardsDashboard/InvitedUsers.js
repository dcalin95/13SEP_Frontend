import React, { useEffect, useState, useContext } from "react";
import WalletContext from "../../context/WalletContext"; // Context pentru wallet
import { ethers } from "ethers";
import contractABI from "../../abi/nodeABI.js";

const contractAddress = "0xA2AeEb08262EaA44D6f5A6b29Ddaf2F4378FDC2B";

const InvitedUsers = () => {
  const { walletAddress } = useContext(WalletContext); // Accesăm adresa portofelului conectat
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchInvitedUsers = async () => {
    if (!walletAddress) {
      setError("Wallet not connected. Please connect your wallet.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      // Exemplu de utilizatori invitați (trebuie înlocuit cu date reale, dacă există API în contract)
      const users = ["0xabc...123", "0xdef...456"];

      const rewardsData = await Promise.all(
        users.map(async (user) => {
          const balanceBN = await contract.codeBalanceOf(
            ethers.constants.AddressZero, // Folosește token nativ
            user
          );
          const balance = parseFloat(ethers.utils.formatEther(balanceBN)).toFixed(4);
          return { wallet: user, balance };
        })
      );

      setInvitedUsers(rewardsData);
    } catch (error) {
      console.error("Error fetching invited users:", error);
      setError("Failed to fetch invited users rewards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitedUsers();
  }, [walletAddress]);

  return (
    <div>
      <h4>Invited Users Rewards</h4>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Loading invited users...</p>
      ) : invitedUsers.length > 0 ? (
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Wallet Address</th>
              <th>Reward (ETH)</th>
            </tr>
          </thead>
          <tbody>
            {invitedUsers.map((user, index) => (
              <tr key={index}>
                <td>{user.wallet}</td>
                <td>{user.balance} ETH</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No invited users rewards available.</p>
      )}
    </div>
  );
};

export default InvitedUsers;


