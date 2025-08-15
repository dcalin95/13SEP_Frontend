import React, { useEffect, useState } from "react";
import styles from "./PresaleHistory.module.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

const PresaleHistory = () => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/presale/history`);
        setHistory(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching history:", err.message);
        setError("Could not load history.");
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
          {history.map((round) => (
            <tr key={round.id}>
              <td>{round.round}</td>
              <td>{round.start_time}</td>
              <td>{round.end_time}</td>
              <td>${round.price}</td>
              <td>{Math.round(round.sold_bits)}</td>
              <td>{Math.round(round.tokensavailable)}</td>
              <td>${Math.round(round.raised_usd)}</td>
              <td>{round.last_update}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PresaleHistory;
