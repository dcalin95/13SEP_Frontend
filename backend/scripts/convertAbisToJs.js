const fs = require("fs");
const path = require("path");

const abiDir = path.join(__dirname, "src", "abi");

fs.readdirSync(abiDir).forEach((file) => {
  if (file.endsWith(".json")) {
    const jsonPath = path.join(abiDir, file);
    const jsFileName = file.replace(".json", ".js");
    const jsPath = path.join(abiDir, jsFileName);

    const content = fs.readFileSync(jsonPath, "utf8");
    const parsed = JSON.parse(content);

    const jsExport = "export default " + JSON.stringify(parsed, null, 2) + ";\n";

    fs.writeFileSync(jsPath, jsExport, "utf8");
    console.log(`✅ Converted: ${file} → ${jsFileName}`);
  }
});
