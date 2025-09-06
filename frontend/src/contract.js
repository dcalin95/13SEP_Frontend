import { ethers } from 'ethers';
import contractABI from '../src/abi/nodeABI.js';

// Adresa contractului Node.sol
const contractAddress = "0x2f4ab05e775bD16959F0A7eBD20B8157D336324A";

export const getContract = async () => {
  if (window.ethereum) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      return contract;
    } catch (error) {
      console.error("Failed to create contract instance:", error);
    }
  } else {
    alert("MetaMask is not installed!");
    return null;
  }
};


