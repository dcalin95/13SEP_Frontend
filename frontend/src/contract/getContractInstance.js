import { ethers } from "ethers";
import { CONTRACTS } from "./contracts";

/**
 * Returnează o instanță a contractului, cu semnătură (dacă e posibil) sau doar pentru citire (read-only).
 * @param {string} contractKey - Cheia contractului din CONTRACTS
 * @param {ethers.providers.Provider | null} externalProvider - Provider opțional (ex: JsonRpcProvider)
 * @returns {ethers.Contract}
 */
export const getContractInstance = async (contractKey, externalProvider = null) => {
  const info = CONTRACTS[contractKey];
  if (!info) {
    throw new Error(`Contract ${contractKey} not found in contracts.js`);
  }

  // Dacă s-a dat un provider extern, folosim contract read-only
  if (externalProvider) {
    return new ethers.Contract(info.address, info.abi, externalProvider);
  }

  // Altfel, încercăm cu wallet-ul (ex: MetaMask)
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  return new ethers.Contract(info.address, info.abi, signer);
};
