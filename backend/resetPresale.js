require("dotenv").config();
const fetch = require("node-fetch");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

fetch("http://localhost:4000/api/presale/reset", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: ADMIN_PASSWORD })
})
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ Presale resetat cu succes:", data);
  })
  .catch((err) => {
    console.error("❌ Eroare la resetarea presale-ului:", err.message);
  });
