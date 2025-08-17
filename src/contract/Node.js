import { ethers } from "ethers";
import nodeABI from "../abi/nodeABI.js";

const NODE_ADDRESS = "0x2f4ab05e775bD16959F0A7eBD20B8157D336324A";

export const getContract = (signerOrProvider) => {
  return new ethers.Contract(NODE_ADDRESS, nodeABI, signerOrProvider);
};