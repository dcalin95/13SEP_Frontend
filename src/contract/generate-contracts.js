const fs = require("fs");
const path = require("path");

// ====================
// 🔗 Lista contractelor ACTIVE pe BSC Testnet
// ====================
const contracts = [
  { name: "BITS", address: "0x19e32912f9074F20F904dFe6007cA8e632F23348", abi: "BitsABI" },
  { name: "Staking", address: "0x11328DAFe3F5d23bEA051fBe4D7fc97c1055Bad3", abi: "stakingABI" },
  { name: "Node", address: "0x0CaFA9578eE5bf8956Cf28c6a9aF7c16C21C5A46", abi: "nodeABI" },
  { name: "AdditionalReward", address: "0xCc8682f1E989A81E0a131840fcc7dB79c9C1B9C6", abi: "AdditionalRewardABI" },
  { name: "CellManager", address: "0x45db857B57667fd3A6a767431152b7fDe647C6Ea", abi: "CellManagerABI" },
  { name: "TelegramRewardContract", address: "0x305741BBCBABD377E18d2bD43B2e879341006464", abi: "TelegramRewardContractABI" },
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
