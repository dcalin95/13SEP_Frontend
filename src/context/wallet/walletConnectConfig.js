export const WALLET_CONNECT_CONFIG = {
  rpc: {
    1: "https://mainnet.infura.io/v3/YOUR-PROJECT-ID", // Ethereum Mainnet
    56: "https://bsc-dataseed.binance.org/", // BSC Mainnet
    97: "https://data-seed-prebsc-1-s1.binance.org:8545/", // BSC Testnet
    137: "https://polygon-rpc.com/", // Polygon
    43114: "https://api.avax.network/ext/bc/C/rpc", // Avalanche
  },
  qrcode: true,
  pollingInterval: 12000,
  // Opțional: adaugă chainId-ul preferat pentru BSC
  chainId: 56, // BSC Mainnet
};

// Funcție pentru a obține RPC URL pentru un chain ID specific
export const getRpcUrl = (chainId) => {
  return WALLET_CONNECT_CONFIG.rpc[chainId] || WALLET_CONNECT_CONFIG.rpc[56]; // fallback la BSC
}; 