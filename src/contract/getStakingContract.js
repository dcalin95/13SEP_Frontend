import { ethers } from "ethers";
import stakingABI from "../abi/stakingABI"; // asigură-te că acest path este corect

// DEPRECATED: Use contractMap.js instead
// Updated with new BSC Testnet address  
const STAKING_ADDRESS = "0x11328DAFe3F5d23bEA051fBe4D7fc97c1055Bad3";

/**
 * Returnează o instanță de contract staking, conectată la provider sau signer
 * @param {ethers.Signer | ethers.providers.Provider} signerOrProvider
 */
export const getStakingContract = (signerOrProvider) => {
  return new ethers.Contract(STAKING_ADDRESS, stakingABI, signerOrProvider);
};
