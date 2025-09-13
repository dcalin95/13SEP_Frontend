import BitsABI from '../abi/BitsABI.js';
import stakingABI from '../abi/stakingABI.js';
import nodeABI from "../abi/nodeABI.js";
import AdditionalRewardABI from '../abi/AdditionalRewardABI.js';
import CellManagerABI from '../abi/CellManagerABI.js';
import TelegramRewardContractABI from '../abi/TelegramRewardContractABI.js';
import erc20ABI from '../abi/erc20ABI.js';

/**
 * Configurare pentru network și contracte
 * Poate comuta între BSC Testnet și BSC Mainnet
 */
const NETWORK_CONFIG = {
  TESTNET: {
    chainId: 97,
    name: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/"
  },
  MAINNET: {
    chainId: 56,
    name: "BSC Mainnet", 
    rpcUrl: "https://bsc-dataseed1.binance.org/"
  }
};

// Set active network (change to MAINNET for production)
const ACTIVE_NETWORK = 'TESTNET';

/**
 * Maparea centralizată a contractelor active pe BSC
 * Actualizată cu noile adrese de contracte pentru TESTNET
 * TODO: Adăugați adresele pentru MAINNET când sunt deployate
 */
export const CONTRACT_MAP = {
  BITS_TOKEN: {
    name: "BitsToken",
    address: "0x19e32912f9074F20F904dFe6007cA8e632F23348",
    abi: BitsABI,
  },
  // Alias for backward compatibility
  BITS: {
    name: "BitsToken",
    address: "0x19e32912f9074F20F904dFe6007cA8e632F23348",
    abi: BitsABI,
  },
  STAKING: {
    name: "TokenStaking", 
    address: "0x11328DAFe3F5d23bEA051fBe4D7fc97c1055Bad3",
    abi: stakingABI,
  },
  NODE: {
    name: "NodeContract",
    address: "0x0CaFA9578eE5bf8956Cf28c6a9aF7c16C21C5A46",
    abi: nodeABI,
  },
  ADDITIONAL_REWARD: {
    name: "AdditionalReward",
    address: "0xCc8682f1E989A81E0a131840fcc7dB79c9C1B9C6",
    abi: AdditionalRewardABI,
  },
  CELL_MANAGER: {
    name: "CellManager", 
    address: "0x45db857B57667fd3A6a767431152b7fDe647C6Ea",
    abi: CellManagerABI,
  },
  TELEGRAM_REWARD: {
    name: "TelegramRewardContract",
    address: "0x305741BBCBABD377E18d2bD43B2e879341006464",
    abi: TelegramRewardContractABI,
  },
  
  // === ERC20 Token Payment Contracts (BSC TESTNET addresses) ===
  USDT: {
    name: "Tether USD",
    address: "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684", // BSC TESTNET USDT
    abi: erc20ABI,
  },
  USDC: {
    name: "USD Coin",
    address: "0x64544969ed7EBf5f083679233325356EbE738930", // BSC TESTNET USDC  
    abi: erc20ABI,
  },
  BUSD: {
    name: "Binance USD", 
    address: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee", // BSC TESTNET BUSD
    abi: erc20ABI,
  },
  DAI: {
    name: "DAI Stablecoin",
    address: "0xEC5dCb5Dbf4B114C9d0F65BcCAb49EC54F6A0867", // BSC TESTNET DAI
    abi: erc20ABI,
  },
  MATIC: {
    name: "Polygon MATIC",
    address: "0x9C21123D94b93361a29B2C2EFB3d5CD8B17e0A9e", // BSC TESTNET MATIC
    abi: erc20ABI,
    decimals: 18,
  },
};

/**
 * Funcție generică pentru crearea instanțelor de contracte
 * @param {string} contractKey - Cheia contractului din CONTRACT_MAP
 * @param {ethers.providers.Provider | ethers.Signer | null} signerOrProvider - Signer sau Provider
 * @returns {ethers.Contract}
 */
export const getContractInstance = (contractKey, signerOrProvider) => {
  const contractInfo = CONTRACT_MAP[contractKey];
  
  if (!contractInfo) {
    throw new Error(`Contract ${contractKey} not found in CONTRACT_MAP`);
  }
  
  if (!signerOrProvider) {
    throw new Error('Signer or Provider is required to create contract instance');
  }
  
  const { ethers } = require('ethers');
  return new ethers.Contract(contractInfo.address, contractInfo.abi, signerOrProvider);
};

/**
 * Funcțiile specifice pentru fiecare contract activ
 */
export const getBITSContract = (signerOrProvider) => 
  getContractInstance('BITS_TOKEN', signerOrProvider);

export const getStakingContract = (signerOrProvider) => 
  getContractInstance('STAKING', signerOrProvider);

export const getNodeContract = (signerOrProvider) => 
  getContractInstance('NODE', signerOrProvider);

export const getAdditionalRewardContract = (signerOrProvider) => 
  getContractInstance('ADDITIONAL_REWARD', signerOrProvider);

export const getCellManagerContract = (signerOrProvider) => 
  getContractInstance('CELL_MANAGER', signerOrProvider);

export const getTelegramRewardContract = (signerOrProvider) => 
  getContractInstance('TELEGRAM_REWARD', signerOrProvider);

/**
 * Export pentru configurarea network-ului
 */
export const getActiveNetwork = () => NETWORK_CONFIG[ACTIVE_NETWORK];
export const getActiveNetworkName = () => ACTIVE_NETWORK;
export const isTestnet = () => ACTIVE_NETWORK === 'TESTNET';
export const isMainnet = () => ACTIVE_NETWORK === 'MAINNET';

/**
 * Funcție helper pentru debugging contracte
 */
export const getContractAddresses = () => {
  return Object.entries(CONTRACT_MAP).reduce((acc, [key, contract]) => {
    acc[key] = contract.address;
    return acc;
  }, {});
};

// Debug logging (can be removed in production)
// console.log("🌐 Active Network:", ACTIVE_NETWORK, NETWORK_CONFIG[ACTIVE_NETWORK]);
// console.log("📝 Contract Addresses:", getContractAddresses());
