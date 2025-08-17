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
        ❌ Eroare la încărcarea datelor din backend:<br />
        <code>{error}</code>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={styles.loading}>⏳ Se încarcă datele...</div>;
  }

  if (!roundActive) {
    return (
      <div className={styles.info}>
        ℹ️ În acest moment nu există o rundă activă de vânzare. Revenim în curând!
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
