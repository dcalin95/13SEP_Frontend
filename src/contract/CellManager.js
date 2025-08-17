import { ethers } from "ethers";
import CellManagerABI from '../abi/CellManagerABI.js'; // asigură-te că acest fișier conține ABI-ul complet al CellManager

const CELLMANAGER_ADDRESS = "0x3bA5978621E8Afe9938562fdCEA3a6C6f3a4F2F6";

export const getCellManagerContract = (signerOrProvider) => {
  return new ethers.Contract(CELLMANAGER_ADDRESS, CellManagerABI, signerOrProvider);
};
