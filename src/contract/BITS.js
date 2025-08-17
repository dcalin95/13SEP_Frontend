import { ethers } from "ethers";
import TokenReceiverABI from '../abi/TokenReceiverABI.js';

const BITS_ADDRESS = "0xEe7E161585F80392D725f559F6EEFC763b8ac6C3";

export const getBITSContract = (signerOrProvider) => {
  return new ethers.Contract(BITS_ADDRESS, tokenABI, signerOrProvider);
};

