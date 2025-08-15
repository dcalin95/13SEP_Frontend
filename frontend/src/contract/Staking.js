import { ethers } from "ethers";
import stakingABI from '../abi/stakingABI.js';

const STAKING_ADDRESS = "0xF6737b6671f9aD9B24557af6ea5340639BDcED53";

export const getStakingContract = (signerOrProvider) => {
  return new ethers.Contract(STAKING_ADDRESS, stakingABI, signerOrProvider);
};

