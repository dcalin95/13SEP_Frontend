import { ethers } from "ethers";

/**
 * BSC Testnet RPC Endpoints - Extended list with more reliable providers
 */
const BSC_TESTNET_RPC_ENDPOINTS = [
  // Primary Binance endpoints
  "https://data-seed-prebsc-1-s1.binance.org:8545/",
  "https://data-seed-prebsc-2-s1.binance.org:8545/",
  "https://data-seed-prebsc-1-s2.binance.org:8545/",
  "https://data-seed-prebsc-2-s2.binance.org:8545/",
  
  // Public node providers (often more reliable)
  "https://bsc-testnet.publicnode.com",
  "https://bsc-testnet-rpc.publicnode.com",
  
  // Alternative providers
  "https://rpc.ankr.com/bsc_testnet_chapel",
  "https://endpoints.omniatech.io/v1/bsc/testnet/public",
  "https://bsc-testnet.blockpi.network/v1/rpc/public",
  "https://bsc-testnet-rpc.allthatnode.com",
  "https://bsc-chapel-rpc.gateway.pokt.network",
  "https://api.zan.top/bsc-testnet",
  
  // Additional fallbacks
  "https://bsc-testnet.4everland.org/v1/37fa9972c1b1cd5fab542c7bdd4cde2f",
  "https://chapel-rpc.binancetests.com",
  "https://data-seed-prebsc-1-s3.binance.org:8545/"
];

/**
 * Try multiple RPC endpoints until one works
 * @returns {ethers.providers.JsonRpcProvider} Working provider
 */
export const getRobustProvider = async () => {
  let lastError = null;

  console.log(`🚀 [RPC FALLBACK] Starting robust provider search across ${BSC_TESTNET_RPC_ENDPOINTS.length} endpoints...`);

  for (let i = 0; i < BSC_TESTNET_RPC_ENDPOINTS.length; i++) {
    const rpcUrl = BSC_TESTNET_RPC_ENDPOINTS[i];
    
    try {
      console.log(`🌐 [RPC ${i + 1}/${BSC_TESTNET_RPC_ENDPOINTS.length}] Testing: ${rpcUrl}`);
      
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Test connection with 6-second timeout (BSC testnet can be slow)
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('6s timeout')), 6000))
      ]);
      
      console.log(`✅ [RPC SUCCESS] Connected to ${rpcUrl} - Block: ${blockNumber}`);
      
      // Double-check with network call
      const network = await provider.getNetwork();
      console.log(`🔗 [RPC VERIFY] Network ID: ${network.chainId}, Name: ${network.name}`);
      
      return provider;
      
    } catch (error) {
      const shortUrl = rpcUrl.replace('https://', '').split('/')[0];
      console.warn(`❌ [RPC FAIL] ${shortUrl}: ${error.message}`);
      lastError = error;
    }
  }
  
  // If all RPC endpoints fail, try MetaMask as fallback
  if (window.ethereum) {
    console.log("🔄 [METAMASK FALLBACK] All RPC endpoints failed, trying MetaMask...");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.getBlockNumber(); // Test connection
      console.log("✅ [METAMASK SUCCESS] Using MetaMask as RPC fallback");
      return provider;
    } catch (mmError) {
      console.error("❌ [METAMASK FAIL]:", mmError.message);
    }
  }
  
  console.error(`💥 [TOTAL FAILURE] All ${BSC_TESTNET_RPC_ENDPOINTS.length} RPC endpoints + MetaMask failed!`);
  throw new Error(`🌐 Complete RPC Failure: All endpoints unreachable. Last error: ${lastError?.message}`);
};

/**
 * Execute contract call with RPC fallback
 * @param {Function} contractCallFn - Function that takes provider and returns promise
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise} Contract call result
 */
export const executeWithFallback = async (contractCallFn, maxRetries = 3) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const provider = await getRobustProvider();
      return await contractCallFn(provider);
    } catch (error) {
      attempt++;
      console.warn(`⚠️ [RPC] Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export default {
  getRobustProvider,
  executeWithFallback,
  BSC_TESTNET_RPC_ENDPOINTS
};
