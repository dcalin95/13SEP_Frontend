import { useEffect, useState, useCallback } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

/**
 * Generic price feed using CoinGecko or fixed price fallback
 * @param {{ coingeckoId?: string|null, fixedPrice?: number|null, vs?: string, refreshMs?: number }} cfg
 */
export default function useTokenPriceFeed(cfg = {}) {
  const { coingeckoId = null, fixedPrice = null, vs = "usd", refreshMs = 10000 } = cfg;
  const [series, setSeries] = useState([]); // [{ time, price }]
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      if (!coingeckoId) {
        // Synthetic flat line around fixed price
        const p = typeof fixedPrice === "number" ? fixedPrice : 1;
        const now = Date.now();
        const pts = Array.from({ length: 24 }, (_, i) => ({ time: now - (24 - i) * 60 * 60 * 1000, price: p }));
        setSeries(pts);
        setPrice(p);
        setLoading(false);
        return;
      }
      const chartUrl = `${BACKEND_URL}/api/market/chart?id=${encodeURIComponent(coingeckoId)}&vs=${encodeURIComponent(vs)}&days=1&interval=hourly`;
      const priceUrl = `${BACKEND_URL}/api/market/price?id=${encodeURIComponent(coingeckoId)}&vs=${encodeURIComponent(vs)}`;
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
      const cur = Number(priceJson?.[coingeckoId]?.[vs]) || null;
      setPrice(cur);
      setLoading(false);
    } catch (e) {
      setError(e?.message || "Failed to load price");
      setLoading(false);
    }
  }, [coingeckoId, fixedPrice, vs]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, refreshMs);
    return () => clearInterval(id);
  }, [fetchData, refreshMs]);

  return { series, price, loading, error, refresh: fetchData };
}


