const fs = require("fs");
const path = require("path");

// ====================
// 🔗 Lista contractelor
// ====================
const contracts = [
  { name: "BITS", address: "0xEe7E161585F80392D725f559F6EEFC763b8ac6C3", abi: "BitsABI" },
  { name: "Staking", address: "0xF6737b6671f9aD9B24557af6ea5340639BDcED53", abi: "stakingABI" },
  { name: "Node", address: "0x2f4ab05e775bD16959F0A7eBD20B8157D336324A", abi: "nodeABI" },
  { name: "ETHReceiver", address: "0x950a2cDADceB2df2f0336c3511bE5F57f81a8523", abi: "ETHReceiverABI" },
  { name: "USDReceiver", address: "0xe74D8E4badd91d8d65225156b0B42a1ADB361A50", abi: "USDReceiverABI" },
  { name: "TokenReceiver", address: "0xeB84453C4c473052e4184A2b5c450Bce946Ffba8", abi: "TokenReceiverABI" },
  { name: "AdditionalReward", address: "0x09a047810986583513e09055364C7Eb94D7Ac3E9", abi: "AdditionalRewardABI" },
  { name: "CellManager", address: "0x3bA5978621E8Afe9938562fdCEA3a6C6f3a4F2F6", abi: "CellManagerABI" },
  { name: "SolanaPaymentWithRewards", address: "0xc683854D407c6310E7Db03f6bc35E0196c9da340", abi: "SolanaPaymentWithRewardsABI" },
  { name: "TelegramRewardContract", address: "0x9d8c6ba5dB5B5CFfD65f01AbA6cd37D3De19B29c", abi: "TelegramRewardContractABI" },
];

// 📁 Unde salvăm fișierele
const outputDir = path.join(__dirname);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 🛠️ Generează câte un fișier pentru fiecare contract
contracts.forEach(({ name, address, abi }) => {
  const filename = path.join(outputDir, `${name}.js`);
  const content = `import { ethers } from "ethers";
import ${abi} from '../abi/${abi}.js';

const ${name.toUpperCase()}_ADDRESS = "${address}";

export const get${name}Contract = (signerOrProvider) => {
  return new ethers.Contract(${name.toUpperCase()}_ADDRESS, ${abi}, signerOrProvider);
};`;

  fs.writeFileSync(filename, content, "utf-8");
  console.log(`✅ Contract ${name}.js creat cu succes.`);
});
