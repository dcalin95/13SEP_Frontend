import React from "react";
import styles from "./PresaleDashboard.module.css";

import PresaleCountdownFlip from "./PresaleCountdownFlip";
import NewPresaleStats from "./NewPresaleStats";
import { useHybridPresaleState } from "./useHybridPresaleState";

const PresaleDashboard = () => {
  const hybridState = useHybridPresaleState();
  const {
    endTime,
    sold,
    supply,
    progress,
    isLoaded,
    error,
    roundActive,
    price,
    roundNumber,
    cellManagerData
  } = hybridState;

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.dualDataContainer}>
          {/* 🔗 CELLMANAGER DATA (Blockchain) */}
          <div className={styles.blockchainSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.chainIcon}>⛓️</span>
              <h3>Blockchain Data</h3>
              <span className={styles.statusDot + ' ' + styles.online}></span>
            </div>
            
            <div className={styles.dataGrid}>
              <div className={styles.dataCard}>
                <div className={styles.cardIcon}>🎯</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardLabel}>Current Round</div>
                  <div className={styles.cardValue}>
                    {cellManagerData.loading ? "..." : (cellManagerData.roundNumber || "N/A")}
                  </div>
                </div>
              </div>
              
              <div className={styles.dataCard}>
                <div className={styles.cardIcon}>💰</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardLabel}>BITS Price</div>
                  <div className={styles.cardValue}>
                    ${cellManagerData.loading ? "..." : (cellManagerData.currentPrice || 0).toFixed(6)}
                  </div>
                </div>
              </div>
              
              <div className={styles.dataCard}>
                <div className={styles.cardIcon}>📦</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardLabel}>Cell ID</div>
                  <div className={styles.cardValue}>
                    {cellManagerData.loading ? "..." : (cellManagerData.cellId ?? "N/A")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 💾 DATABASE DATA (Simulation) */}
          <div className={styles.databaseSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.dbIcon}>💾</span>
              <h3>Simulation Data</h3>
              <span className={styles.statusDot + ' ' + styles.offline}></span>
            </div>
            
            <div className={styles.errorMessage}>
              <div className={styles.errorIcon}>⚠️</div>
              <div className={styles.errorText}>
                <h4>Database Connection Lost</h4>
                <p>Simulation data temporarily unavailable. BITS sales tracking will resume when connection is restored.</p>
                <div className={styles.errorDetails}>
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
            
            <div className={styles.fallbackData}>
              <div className={styles.fallbackCard}>
                <div className={styles.cardIcon}>📊</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardLabel}>BITS Sold (Simulated)</div>
                  <div className={styles.cardValue}>---</div>
                </div>
              </div>
              
              <div className={styles.fallbackCard}>
                <div className={styles.cardIcon}>🎯</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardLabel}>BITS Available</div>
                  <div className={styles.cardValue}>---</div>
                </div>
              </div>
            </div>
          </div>

          {/* 🔄 RECONNECTION STATUS */}
          <div className={styles.reconnectionStatus}>
            <div className={styles.statusIndicator}>
              <div className={styles.pulsingDot}></div>
              <span>Attempting to reconnect to simulation database...</span>
            </div>
            <div className={styles.statusNote}>
              <strong>Note:</strong> Blockchain data remains fully operational. Only simulation tracking is affected.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        <div className={styles.aiLoadingContainer}>
          <div className={styles.neuralNetwork}>
            <div className={styles.node}></div>
            <div className={styles.node}></div>
            <div className={styles.node}></div>
            <div className={styles.connection}></div>
            <div className={styles.connection}></div>
          </div>
          <span className={styles.loadingText}>Neural Networks Initializing...</span>
        </div>
      </div>
    );
  }

  if (!roundActive) {
    return (
      <div className={styles.info}>
        <div className={styles.infoContainer}>
          <div className={styles.hologram}>
            <span className={styles.infoIcon}>⚡</span>
          </div>
          <h3>Next Generation Presale</h3>
          <p>The next presale round is being computed by our AI systems. Stay tuned!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Componenta verticală într-o singură coloană */}
      <div className={styles.column}>
        <PresaleCountdownFlip endTime={endTime} />
        
        {/* 🎯 MARKETING INFO: Only blockchain data for public */}
        <div className={styles.debugInfo}>
          <div className={styles.debugSection}>
            <h5>🔗 Round {roundNumber} • Live on Blockchain • Secure & Transparent</h5>
          </div>
          <div className={styles.debugSection}>
            <h5>💎 Early Bird Pricing • Limited Time Offer • Join Now!</h5>
          </div>
        </div>

        <NewPresaleStats 
          sold={sold} 
          supply={supply} 
          price={price} 
          roundNumber={roundNumber}
        />
      </div>
    </div>
  );
};

export default PresaleDashboard;
