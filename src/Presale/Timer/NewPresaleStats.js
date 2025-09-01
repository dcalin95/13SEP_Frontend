import React, { useEffect, useState } from "react";
import styles from "./NewPresaleStats.module.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

// AnimatedNumber component
const AnimatedNumber = ({ value, duration = 1000, prefix = "", suffix = "", compact = false }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const animatedValue = value * progress;
      setDisplayed(animatedValue);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatCompactNumber = (value) => {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
    if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
    return value.toLocaleString();
  };

  const formatted = compact
    ? formatCompactNumber(displayed)
    : parseFloat(displayed).toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      });

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

// Cosmic Progress Bar Component
const CosmicProgressBar = ({ percentage, sold, total, totalPresaleSold, totalPresaleSupply, totalPresalePercentage }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / 1000, 1);
      setAnimatedPercentage(totalPresalePercentage * progress);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [totalPresalePercentage]);

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${animatedPercentage}%` }}
        />
        <div className={styles.progressGlow} />
        {/* Japanese Train Arrow */}
        <div 
          className={styles.progressArrow}
          style={{ left: `calc(${animatedPercentage}% - 15px)` }}
        />
      </div>
             <div className={styles.progressText}>
         <span className={styles.percentage}>{animatedPercentage.toFixed(1)}%</span>
         <span className={styles.soldInfo}>
           <AnimatedNumber value={totalPresaleSold} compact /> of <AnimatedNumber value={totalPresaleSupply} compact /> $BITS
         </span>
       </div>
    </div>
  );
};

const NewPresaleStats = ({ sold, supply, price, roundNumber }) => {
  const [previousRoundData, setPreviousRoundData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calculate values
  const totalSupply = sold + supply;
  const remainingTokens = supply;
  const currentRoundPercentage = ((sold / totalSupply) * 100);
  
  // Total presale supply from tokenomics (30% of total supply)
  const TOTAL_PRESALE_SUPPLY = 3000000000; // 3 billion $BITS for presale
  
  // Debug logging
  console.log('🔍 [NewPresaleStats] Debug:', {
    sold: sold,
    supply: supply,
    totalSupply: totalSupply,
    currentRoundPercentage: currentRoundPercentage,
    roundNumber: roundNumber,
    previousRoundData: previousRoundData,
    previousRoundDataType: typeof previousRoundData,
    totalSoldFromAllPreviousRounds: previousRoundData?.totalSoldFromAllPreviousRounds,
    calculation: previousRoundData ? `${previousRoundData.totalSoldFromAllPreviousRounds} + ${sold}` : `just ${sold}`,
    totalPresaleSold: previousRoundData ? previousRoundData.totalSoldFromAllPreviousRounds + sold : sold,
    totalPresalePercentage: ((previousRoundData ? previousRoundData.totalSoldFromAllPreviousRounds + sold : sold) / TOTAL_PRESALE_SUPPLY) * 100
  });
  
  // Calculate total presale percentage (all rounds combined) - fix NaN
  const safePreviousTotal = previousRoundData?.totalSoldFromAllPreviousRounds;
  const totalPresaleSold = (safePreviousTotal && !isNaN(safePreviousTotal)) ? safePreviousTotal + sold : sold;
  const totalPresalePercentage = ((totalPresaleSold / TOTAL_PRESALE_SUPPLY) * 100);

  // Fetch all previous rounds data
  useEffect(() => {
    const fetchAllRoundsData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/presale/history`);
        const history = response.data || [];
        
        // Calculate total sold from all previous rounds
        let totalSoldFromPreviousRounds = 0;
        history.forEach(round => {
          if (round.round < roundNumber) {
            totalSoldFromPreviousRounds += Math.round(round.sold_bits);
          }
        });
        
        // Find the previous round for USD display
        const previousRound = history.find(round => round.round === roundNumber - 1);
        
        if (previousRound) {
          setPreviousRoundData({
            round: previousRound.round,
            raisedUSD: Math.round(previousRound.raised_usd),
            soldBits: Math.round(previousRound.sold_bits),
            totalSoldFromAllPreviousRounds: totalSoldFromPreviousRounds
          });
        } else {
          setPreviousRoundData({
            totalSoldFromAllPreviousRounds: totalSoldFromPreviousRounds
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching rounds data:", error);
        setLoading(false);
      }
    };

    fetchAllRoundsData();
  }, [roundNumber]);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🎯 Round {roundNumber} Statistics</h3>
      
      {/* Explanation Box */}
      <div className={styles.explanationBox}>
        <div className={styles.explanationIcon}>ℹ️</div>
                 <div className={styles.explanationText}>
           <strong>How it works:</strong> The top progress bar shows Round {roundNumber} completion percentage. 
           The bottom progress bar shows total presale completion (all rounds combined from 3B total supply). 
           Both progress bars have different percentages and visual effects.
         </div>
      </div>
      
      <div className={styles.statsGrid}>
                 {/* 1. Current Round Progress Bar */}
         <div className={styles.statCard}>
           <div className={styles.statIcon}>📊</div>
           <div className={styles.statContent}>
             <div className={styles.statLabel}>Round {roundNumber} Completion</div>
             <div className={styles.roundProgressBar}>
               <div 
                 className={styles.roundProgressFill}
                 style={{ width: `${currentRoundPercentage}%` }}
               />
                               <div className={styles.roundProgressText}>
                  {currentRoundPercentage.toFixed(2)}%
                </div>
             </div>
           </div>
         </div>

        {/* 2. Total BITS Sold */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total $BITS Sold</div>
            <div className={styles.statValue}>
              <AnimatedNumber value={sold} compact suffix=" $BITS" />
            </div>
          </div>
        </div>

        {/* 3. Remaining BITS */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Remaining $BITS</div>
            <div className={styles.statValue}>
              <AnimatedNumber value={remainingTokens} compact suffix=" $BITS" />
            </div>
          </div>
        </div>

        {/* 4. Previous Round USD */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏆</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>
              {previousRoundData ? `Round ${previousRoundData.round} Raised` : 'Previous Round'}
            </div>
            <div className={styles.statValue}>
              {loading ? (
                <span className={styles.loading}>Loading...</span>
              ) : previousRoundData ? (
                <AnimatedNumber value={previousRoundData.raisedUSD} prefix="$" compact />
              ) : (
                <span className={styles.noData}>No previous round</span>
              )}
            </div>
          </div>
        </div>
      </div>

             {/* 5. Cosmic Progress Bar */}
       <div className={styles.progressSection}>
         <CosmicProgressBar 
           percentage={currentRoundPercentage} 
           sold={sold} 
           total={totalSupply}
           totalPresaleSold={totalPresaleSold}
           totalPresaleSupply={TOTAL_PRESALE_SUPPLY}
           totalPresalePercentage={totalPresalePercentage}
         />
       </div>
    </div>
  );
};

export default NewPresaleStats; 