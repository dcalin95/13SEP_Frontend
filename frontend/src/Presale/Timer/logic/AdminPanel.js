import React, { useState, useEffect } from "react";
import { default as axios } from "axios";
import styles from "./AdminPanel.module.css";
import { toast } from "react-toastify";
import { getSuggestedPriceForRound } from "./roundHelper";
import PresaleHistory from "../PresaleHistory";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASS || "fallback123";

const AdminPanel = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [roundInput, setRoundInput] = useState("1");
  const [priceInput, setPriceInput] = useState("0.01");
  const [supplyInput, setSupplyInput] = useState("20000000");
  const [info, setInfo] = useState(null);
  const [autoSimRunning, setAutoSimRunning] = useState(false);
  const [manualUsd, setManualUsd] = useState("");
const [manualBits, setManualBits] = useState("");


  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken === ADMIN_PASS) {
      setIsAuthorized(true);
      fetchPresaleState();
      fetchSimulationStatus();
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchPresaleState();
      fetchSimulationStatus();
    }
  }, [isAuthorized]);

  const handleLogin = () => {
    const input = prompt("🔐 Enter Admin Password:");
    if (input === ADMIN_PASS) {
      setIsAuthorized(true);
      localStorage.setItem("admin_token", input);
      toast.success("✅ Autentificare reușită");
    } else {
      alert("❌ Wrong password!");
    }
  };
  const handleManualSimulation = async () => {
  const usd = parseFloat(manualUsd);
  const bits = parseInt(manualBits);

  if (isNaN(usd) || isNaN(bits) || usd <= 0 || bits <= 0) {
    toast.error("⚠️ Introdu valori valide pentru USD și BITS.");
    return;
  }

  try {
   const res = await axios.post(`${API_URL}/api/manual-simulation/manual`, {
  password: ADMIN_PASS,
  usd,
  bits
});


    toast.success(res.data.message || "✅ Vânzare simulată cu succes.");
    fetchPresaleState();
       setManualUsd("");
    setManualBits("");
  } catch (err) {
    console.error("❌ Eroare la simulare manuală:", err.message);
    toast.error("❌ Eroare la simulare manuală.");
  }
};


  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthorized(false);
    toast.info("🛑 Delogat cu succes.");
  };

  const fetchPresaleState = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/presale/current`);
      setInfo(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch presale state:", err.message);
    }
  };

  const fetchSimulationStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/status`);
      setAutoSimRunning(res.data.running);
    } catch (err) {
      console.error("❌ Eroare la status autosimulare:", err.message);
    }
  };

  const handleStartRound = async () => {
    const round = parseInt(roundInput);
    const price = parseFloat(priceInput);
    const tokensAvailable = parseInt(supplyInput);

    if (isNaN(round) || isNaN(price) || isNaN(tokensAvailable)) {
      alert("⚠️ Toate câmpurile trebuie completate corect.");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/presale/start-round`, {
        password: ADMIN_PASS,
        round,
        price: Math.floor(price * 100),
        tokensAvailable,
      });

      toast.success(res.data.message || "✅ Rundă pornită cu succes!");
      setRoundInput("");
      setPriceInput("");
      setSupplyInput("");
      fetchPresaleState();
    } catch (err) {
      console.error("❌ Failed to start round:", err.message);
      toast.error("❌ Eroare la pornirea rundei.");
    }
  };

  const handleEndRound = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/presale/end-round`, {
        password: ADMIN_PASS,
      });
      toast.success(res.data.message || "✅ Rundă încheiată!");
      fetchPresaleState();
    } catch (err) {
      console.error("❌ Failed to end round:", err.message);
      toast.error("❌ Eroare la încheierea rundei.");
    }
  };

  const handleResetPresale = async () => {
    if (!window.confirm("⚠️ Ești sigur că vrei să resetezi toate datele?")) return;

    try {
      const res = await axios.post(`${API_URL}/api/presale/reset`, {
        password: ADMIN_PASS,
      });

      toast.success(res.data.message || "✅ Presale resetat complet.");
      fetchPresaleState();
    } catch (err) {
      console.error("❌ Eroare la resetare:", err.message);
      toast.error("❌ Eroare la resetarea presale.");
    }
  };

  const handleStartAutoSim = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/start`, {
        password: ADMIN_PASS,
      });
      toast.success(res.data.message || "✅ AutoSimulare pornită!");
      await fetchSimulationStatus();
    } catch (err) {
      console.error("❌ Start auto:", err.message);
      toast.error("❌ Eroare la pornirea autosimulării.");
    }
  };

  const handleStopAutoSim = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/stop`, {
        password: ADMIN_PASS,
      });
      toast.success(res.data.message || "🛑 AutoSimulare oprită!");
      await fetchSimulationStatus();
    } catch (err) {
      console.error("❌ Stop auto:", err.message);
      toast.error("❌ Eroare la oprirea autosimulării.");
    }
  };

  const handleResetAndStart = async () => {
    if (!window.confirm("⚠️ Vrei să resetezi și să pornesc o nouă rundă cu prețul de $0.01?")) return;

    try {
      await handleStopAutoSim();
      await handleResetPresale();

      const res = await axios.post(`${API_URL}/api/presale/start-round`, {
        password: ADMIN_PASS,
        round: 1,
        price: 1,
        tokensAvailable: 20000000,
      });

      toast.success("✅ Presale resetat și rundă nouă pornită!");
      fetchPresaleState();
    } catch (err) {
      console.error("❌ Eroare la resetare și pornire:", err.message);
      toast.error("❌ Eroare la resetare și pornire.");
    }
  };

  return (
    <>
      <div
        className={styles["status-badge"]}
        style={{ background: isAuthorized ? "#0f0" : "#f00" }}
      />
      {!isAuthorized ? (
        <button onClick={handleLogin} className={styles["login-btn"]}>
          🔐 Login
        </button>
      ) : (
        <div className={styles["admin-panel"]}>
          <button onClick={handleLogout} className={styles["logout-btn"]}>
            🛑 Logout
          </button>

          <div className={styles["section"]}>
            <h3>🎯 Start New Round</h3>
            <input
              type="number"
              value={roundInput}
              onChange={(e) => setRoundInput(e.target.value)}
              placeholder="Round Number"
            />
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="Price in USD"
              step="0.01"
            />
            <input
              type="number"
              value={supplyInput}
              onChange={(e) => setSupplyInput(e.target.value)}
              placeholder="Tokens Available"
            />
            <button onClick={handleStartRound}>▶️ Start Round</button>
          </div>

          <div className={styles["section"]}>
            <h3>⚡ Quick Actions</h3>
            <button onClick={handleEndRound}>⏹️ End Current Round</button>
            <button onClick={handleResetPresale}>🔄 Reset Presale</button>
            <button onClick={handleResetAndStart}>🔄 Reset & Start New</button>
          </div>

          <div className={styles["section"]}>
            <h3>🤖 Auto Simulation</h3>
            <button onClick={handleStartAutoSim}>▶️ Start AutoSim</button>
            <button onClick={handleStopAutoSim}>⏹️ Stop AutoSim</button>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              Status: {autoSimRunning ? "🟢 Activă" : "🔴 Inactivă"}
            </p>
          </div>
<div className={styles["section"]}>
  <h3>💰 Manual Simulation</h3>
 <input
  type="number"
  placeholder="Simulate USD"
  value={manualUsd}
  onChange={(e) => setManualUsd(e.target.value)}
/>
<input
  type="number"
  placeholder="Simulate BITS"
  value={manualBits}
  onChange={(e) => setManualBits(e.target.value)}
/>

  <button onClick={handleManualSimulation}>➕ Simulează vânzare</button>
</div>

          {info && (
            <div className={styles["info-section"]}>
              <h3>📊 Current State</h3>
              <p>Round: {info.roundNumber}</p>
              <p>Price: ${(info.price / 100).toFixed(6)}</p>
              <p>Available: {info.tokensAvailable.toLocaleString()} BITS</p>
              <p>Sold: {info.sold.toLocaleString()} BITS</p>
              <p>Raised: ${info.totalRaised.toLocaleString()}</p>
              <p>Progress: {info.progress.toFixed(2)}%</p>
            </div>
          )}
          <div className={styles["section"]}>
  <h3>📜 Istoric Runde</h3>
  <PresaleHistory />
</div>

        </div>
      )}
    </>
  );
};

export default AdminPanel;
