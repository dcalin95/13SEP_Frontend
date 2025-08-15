import { ethers } from "ethers";
import stakingABI from "../abi/stakingABI"; // asigură-te că acest path este corect

const STAKING_ADDRESS = "0xF6737b6671f9aD9B24557af6ea5340639BDcED53"; // adresa reală

/**
 * Returnează o instanță de contract staking, conectată la provider sau signer
 * @param {ethers.Signer | ethers.providers.Provider} signerOrProvider
 */
export const getStakingContract = (signerOrProvider) => {
  return new ethers.Contract(STAKING_ADDRESS, stakingABI, signerOrProvider);
};
