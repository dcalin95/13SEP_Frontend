import React, { useMemo, useState } from "react";
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import useSTXPriceFeed from "./useSTXPriceFeed";

function formatTime(ts) {
  try { return new Date(ts).toLocaleTimeString(); } catch { return ts; }
}

export default function STXPaperTrade() {
  const { series, price, loading, error, refresh } = useSTXPriceFeed();
  const [usdt, setUsdt] = useState(1000);
  const [stx, setStx] = useState(0);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState(100);
  const [slippageBps] = useState(20); // 0.2%

  const equity = useMemo(() => {
    const stxVal = (stx * (price || 0));
    return Number((usdt + stxVal).toFixed(2));
  }, [usdt, stx, price]);

  function buyMarket() {
    if (!price || amount <= 0 || amount > usdt) return;
    const exec = price * (1 + slippageBps / 10000);
    const got = amount / exec;
    setUsdt(prev => Number((prev - amount).toFixed(2)));
    setStx(prev => Number((prev + got).toFixed(6)));
    setHistory(prev => [{ side: 'BUY', amount, exec, got, time: Date.now() }, ...prev]);
  }
  function sellMarket() {
    if (!price || amount <= 0) return;
    const exec = price * (1 - slippageBps / 10000);
    const need = amount / exec; // USDT to receive amount → STX required
    if (need > stx) return;
    setStx(prev => Number((prev - need).toFixed(6)));
    setUsdt(prev => Number((prev + amount).toFixed(2)));
    setHistory(prev => [{ side: 'SELL', amount, exec, need, time: Date.now() }, ...prev]);
  }

  const chartData = useMemo(() => {
    return series.map(p => ({ x: p.time, y: Number(p.price?.toFixed(6)) }));
  }, [series]);

  return (
    <div style={{ background:'#0b0b10', color:'#e9eef6', borderRadius:12, padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ fontWeight:600 }}>STX Paper Trade</div>
        <div>
          <span style={{ opacity:.8, marginRight:8 }}>Price:</span>
          <span style={{ fontWeight:700 }}>{loading ? '…' : (price ? `$${price.toFixed(4)}` : 'N/A')}</span>
          <button onClick={refresh} style={{ marginLeft:12, padding:'4px 8px', borderRadius:6, border:'1px solid #26304a', background:'#0f1421', color:'#e9eef6' }}>Refresh</button>
        </div>
      </div>

      <div style={{ width:'100%', height:360, background:'#0f1421', border:'1px solid #26304a', borderRadius:10, marginBottom:12 }}>
        {chartData.length > 1 ? (
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="stxFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.35}/>
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2942" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" domain={["dataMin","dataMax"]} tickFormatter={formatTime} stroke="#9db2d6" tick={{ fontSize: 12 }} />
              <YAxis domain={['auto','auto']} stroke="#9db2d6" tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(v)=>new Date(v).toLocaleString()} formatter={(v)=>[`$${v}`,'STX']} contentStyle={{ background:'#0b1020', border:'1px solid #26304a', color:'#e9eef6' }} />
              <Area type="monotone" dataKey="y" stroke="#00d4ff" fill="url(#stxFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#8fa3c5' }}>No chart data</div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={{ background:'#0f1421', border:'1px solid #26304a', borderRadius:10, padding:12 }}>
          <div style={{ marginBottom:8, fontWeight:600 }}>Account (simulated)</div>
          <div>USDT: <strong>${usdt.toFixed(2)}</strong></div>
          <div>STX: <strong>{stx.toFixed(6)}</strong> {price ? `(≈ $${(stx*price).toFixed(2)})` : ''}</div>
          <div style={{ marginTop:8 }}>Equity: <strong>${equity.toFixed(2)}</strong></div>
        </div>
        <div style={{ background:'#0f1421', border:'1px solid #26304a', borderRadius:10, padding:12 }}>
          <div style={{ marginBottom:8, fontWeight:600 }}>Trade</div>
          <label style={{ display:'block', marginBottom:8 }}>Amount (USDT)
            <input type="number" value={amount} min={0} step={10} onChange={(e)=>setAmount(Number(e.target.value))} style={{ width:'100%', marginTop:6, padding:8, borderRadius:8, border:'1px solid #26304a', background:'#0b1020', color:'#e9eef6' }} />
          </label>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={buyMarket} style={{ flex:1, padding:'10px 12px', borderRadius:8, border:'none', background:'#2ecc71', color:'#0b0b10', fontWeight:700 }}>Buy STX</button>
            <button onClick={sellMarket} style={{ flex:1, padding:'10px 12px', borderRadius:8, border:'none', background:'#e74c3c', color:'#fff', fontWeight:700 }}>Sell STX</button>
          </div>
          <div style={{ marginTop:8, opacity:.8, fontSize:12 }}>Slippage simulated: 0.2%</div>
        </div>
      </div>

      <div style={{ background:'#0f1421', border:'1px solid #26304a', borderRadius:10, padding:12, marginBottom:12 }}>
        <div style={{ marginBottom:8, fontWeight:600 }}>History</div>
        {history.length === 0 ? <div style={{ opacity:.8 }}>No trades yet.</div> : (
          <div style={{ display:'grid', gap:6 }}>
            {history.map((h, idx) => (
              <div key={idx} style={{ display:'flex', justifyContent:'space-between', fontFamily:'monospace', fontSize:13 }}>
                <span>{new Date(h.time).toLocaleTimeString()}</span>
                <span>{h.side}</span>
                <span>{h.side==='BUY' ? `$${h.amount} @ $${h.exec.toFixed(6)} → +${h.got.toFixed(6)} STX` : `$${h.amount} @ $${h.exec.toFixed(6)} ← −${h.need?.toFixed(6)} STX`}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


