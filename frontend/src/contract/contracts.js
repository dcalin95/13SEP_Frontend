import BitsABI from '../abi/BitsABI.js';
import stakingABI from '../abi/stakingABI.js';
import nodeABI from "../abi/nodeABI.js";
import erc20ABI from '../abi/erc20ABI.js';
import AdditionalRewardABI from '../abi/AdditionalRewardABI.js';
import CellManagerABI from '../abi/CellManagerABI.js';
import SolanaPaymentWithRewards from '../abi/SolanaPaymentWithRewards.js';
import TelegramRewardContractABI from '../abi/TelegramRewardContractABI.js';

export const CONTRACTS = {
  BITS: {
    name: "BitsToken",
    address: "0xEe7E161585F80392D725f559F6EEFC763b8ac6C3",
    abi: BitsABI, // ✅ corect!
  },
  STAKING: {
    name: "TokenStaking",
    address: "0xF6737b6671f9aD9B24557af6ea5340639BDcED53",
    abi: stakingABI,
  },
  NODE: {
    name: "NodeContract",
    address: "0x2f4ab05e775bD16959F0A7eBD20B8157D336324A",
    abi: nodeABI,
  },
  ETH_RECEIVER: {
    name: "ETHReceiver",
    address: "0x950a2cDADceB2df2f0336c3511bE5F57f81a8523",
    abi: erc20ABI,
  },
  USD_RECEIVER: {
    name: "USDReceiver",
    address: "0xe74D8E4badd91d8d65225156b0B42a1ADB361A50",
    abi: erc20ABI,
  },
  TOKEN_RECEIVER: {
    name: "TokenReceiver",
    address: "0xeB84453C4c473052e4184A2b5c450Bce946Ffba8",
    abi: erc20ABI,
  },
  ADDITIONAL_REWARD: {
    name: "AdditionalReward",
    address: "0x09a047810986583513e09055364C7Eb94D7Ac3E9",
    abi: AdditionalRewardABI,
  },
  CELL_MANAGER: {
    name: "CellManager",
    address: "0x3bA5978621E8Afe9938562fdCEA3a6C6f3a4F2F6",
    abi: CellManagerABI,
  },
  SOLANA_PAYMENT: {
    name: "SolanaPaymentWithRewards",
    address: "0xc683854D407c6310E7Db03f6bc35E0196c9da340",
    abi: SolanaPaymentWithRewards,
  },
  TELEGRAM_REWARD: {
    name: "TelegramRewardContract",
    address: "0x9d8c6ba5dB5B5CFfD65f01AbA6cd37D3De19B29c",
    abi: TelegramRewardContractABI,
  },

  // === ERC20 Token Payment Contracts ===
  USDT: {
    name: "Tether USD",
    address: "0x55d398326f99059fF775485246999027B3197955",
    abi: erc20ABI,
  },
  USDC: {
    name: "USD Coin",
    address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    abi: erc20ABI,
  },
  BUSD: {
    name: "Binance USD",
    address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    abi: erc20ABI,
  },
  DAI: {
    name: "DAI Stablecoin",
    address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    abi: erc20ABI,
  },
  MATIC: {
    name: "Polygon MATIC",
    address: "0xcc42724c6683b7e57334c4e856f4c9965ed682bd",
    abi: erc20ABI,
    decimals: 18,
  },
};


