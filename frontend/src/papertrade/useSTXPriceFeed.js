import { useEffect, useState, useCallback } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

// Simple CoinGecko feed for STX (id: blockstack)
export default function useSTXPriceFeed() {
  const [series, setSeries] = useState([]); // [{ time, price }]
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const chartUrl = `${BACKEND_URL}/api/market/chart?id=blockstack&vs=usd&days=1&interval=hourly`;
      const priceUrl = `${BACKEND_URL}/api/market/price?id=blockstack&vs=usd`;
      const [chartRes, priceRes] = await Promise.all([
        fetch(chartUrl, { cache: "no-store" }),
        fetch(priceUrl, { cache: "no-store" })
      ]);
      const chartJson = await chartRes.json();
      const priceJson = await priceRes.json();
      const points = Array.isArray(chartJson?.prices)
        ? chartJson.prices.map(([ts, p]) => ({ time: ts, price: Number(p) }))
        : [];
      setSeries(points);
      setPrice(Number(priceJson?.blockstack?.usd) || null);
      setLoading(false);
    } catch (e) {
      setError(e?.message || "Failed to load STX price");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, [fetchData]);

  return { series, price, loading, error, refresh: fetchData };
}


