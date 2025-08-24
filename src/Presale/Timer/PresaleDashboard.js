import React from "react";
import styles from "./PresaleDashboard.module.css";

import PresaleCountdownFlip from "./PresaleCountdownFlip";
import NewPresaleStats from "./NewPresaleStats";
import { usePresaleState } from "./usePresaleState";

const PresaleDashboard = () => {
  const {
    endTime,
    sold,
    supply,
    price,
    progress,
    isLoaded,
    error,
    roundActive,
    roundNumber
  } = usePresaleState();

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.aiErrorContainer}>
          <div className={styles.aiOrb}>
            <div className={styles.pulse}></div>
            <div className={styles.glow}></div>
            <span className={styles.aiIcon}>🤖</span>
          </div>
          <div className={styles.errorContent}>
            <h3 className={styles.errorTitle}>AI System Temporarily Offline</h3>
            <p className={styles.errorMessage}>
              Our neural networks are recalibrating market data streams. 
              The presale continues operating normally.
            </p>
            <div className={styles.statusIndicator}>
              <span className={styles.dot}></span>
              <span>Reconnecting to data sources...</span>
            </div>
            <div className={styles.techDetails}>
              <details>
                <summary>Technical Details</summary>
                <code>{error}</code>
              </details>
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
