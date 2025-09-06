import React, { useEffect, useState } from "react";
import styles from "./PresaleHistory.module.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

const PresaleHistory = () => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/presale/history`);
        console.log("📜 [PresaleHistory] Raw response:", res.data);
        
        // Ensure response is an array
        const historyData = Array.isArray(res.data) ? res.data : [];
        console.log("📜 [PresaleHistory] Processed history:", historyData);
        
        setHistory(historyData);
      } catch (err) {
        console.error("❌ Error fetching history:", err.message);
        setError("Could not load history.");
        setHistory([]); // Ensure history is always an array
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>📜 Istoric Runde Presale</h2>

      {error && <p className={styles.error}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Start</th>
            <th>End</th>
            <th>Price</th>
            <th>Sold</th>
            <th>Remaining</th>
            <th>Total $</th>
            <th>Last Update</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(history) && history.length > 0 ? (
            history.map((round, index) => (
              <tr key={round.id || index}>
                <td>{round.round || 'N/A'}</td>
                <td>{round.start_time || 'N/A'}</td>
                <td>{round.end_time || 'N/A'}</td>
                <td>${round.price || '0'}</td>
                <td>{Math.round(round.sold_bits || 0)}</td>
                <td>{Math.round(round.tokensavailable || 0)}</td>
                <td>${Math.round(round.raised_usd || 0)}</td>
                <td>{round.last_update || 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                {error ? '❌ Error loading data' : '⏳ No history data available'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PresaleHistory;
