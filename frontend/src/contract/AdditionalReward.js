// src/contract/AdditionalReward.js

import { ethers } from "ethers";
import rewardABI from "../abi/AdditionalRewardABI.js";

const ADDITIONALREWARD_ADDRESS = "0x09a047810986583513e09055364C7Eb94D7Ac3E9";

export const getAdditionalRewardContract = (signerOrProvider) => {
  return new ethers.Contract(ADDITIONALREWARD_ADDRESS, rewardABI, signerOrProvider);
};
