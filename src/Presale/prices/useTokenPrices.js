import { useEffect, useState } from "react";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,binancecoin,tether,usd-coin,solana,polygon,shiba-inu&vs_currencies=usd";

const tokenKeyMap = {
  ethereum: "ETH",
  binancecoin: "BNB",
  tether: "USDT",
  "usd-coin": "USDC",
  solana: "SOL",
  polygon: "MATIC",
  "shiba-inu": "SHIB",
};

// 💰 Prețuri fallback pentru tokenuri lipsă sau non-CoinGecko
const mockPrices = {
  ETH: 3600,
  BNB: 600,
  USDT: 1,
  USDC: 1,
  SOL: 140,
  MATIC: 0.66,
  SHIB: 0.000012,
  "USDC-Solana": 1, // ✅ hardcodăm pentru tokenul solana-nativ
};

export default function useTokenPrices() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const response = await fetch(COINGECKO_URL);
      const data = await response.json();

      const mappedPrices = {};
      for (const [id, value] of Object.entries(data)) {
        const key = tokenKeyMap[id];
        if (key) {
          mappedPrices[key] = {
            price: value.usd,
            source: "coingecko",
          };
        }
      }

      // 🔁 Adăugăm fallback pentru tokenuri lipsă sau speciale
      for (const key in mockPrices) {
        if (!mappedPrices[key]) {
          mappedPrices[key] = {
            price: mockPrices[key],
            source: "mock",
          };
        }
      }

      console.log("✅ Final token prices:", mappedPrices);
      setPrices(mappedPrices);
    } catch (err) {
      console.error("❌ Failed to fetch token prices from CoinGecko:", err);
      setError("Failed to fetch token prices.");

      // fallback complet în caz de eroare
      const fallback = {};
      for (const key in mockPrices) {
        fallback[key] = {
          price: mockPrices[key],
          source: "mock",
        };
      }
      setPrices(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000); // la fiecare 60 secunde
    return () => clearInterval(interval);
  }, []);

  return { prices, loading, error };
}

