import { ethers } from "ethers";
import erc20ABI from '../abi/erc20ABI.js';

const TELEGRAMREWARDCONTRACT_ADDRESS = "0x9d8c6ba5dB5B5CFfD65f01AbA6cd37D3De19B29c";

export const getTelegramRewardContractContract = (signerOrProvider) => {
  return new ethers.Contract(TELEGRAMREWARDCONTRACT_ADDRESS, erc20ABI, signerOrProvider);
};

