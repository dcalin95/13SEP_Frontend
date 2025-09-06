// src/Presale/Timer/PresaleCountdownFlip.js
import React, { useEffect, useState } from "react";
import styles from "./PresaleCountdownFlip.module.css";
import { usePresaleState } from "./usePresaleState";
import TotalRaised from "./logic/TotalRaised";
import bitsLogo from "../../assets/logo.png";

const TOTAL_ROUNDS = 12;

const getTimeLeft = (endTime) => {
  const now = Date.now();
  const diff = endTime - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

const TimeBox = ({ label, value }) => (
  <div className={styles.timeBox} translate="no">
    <div className={styles.timeValue} translate="no">{String(value).padStart(2, "0")}</div>
    <div className={styles.timeLabel} translate="no">{label}</div>
  </div>
);

const PresaleCountdownFlip = () => {
  const {
    isLoaded,
    roundNumber,
    price,
    endTime,
    totalBoosted,
    sold,
    progress,
  } = usePresaleState();

  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0,
  });

  useEffect(() => {
    if (!endTime) return;
    const update = () => setTimeLeft(getTimeLeft(endTime));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const currentPrice = price ? price / 100 : 0;

  if (!isLoaded) return null;

  return (
    <div className={styles.countdownFlip} translate="no">
      <div className={styles.cardHeader}>
        <img src={bitsLogo} alt="BITS Token Logo" className={styles.bitsLogo} />
      </div>

      <div className={styles.priceInfo}>
        <div className={styles.roundText} translate="no">
          {roundNumber ? (
            <>
              $BITS Presale Round <span className={styles.currentRound}>{roundNumber}</span> ➜ <span className={styles.totalRounds}>{TOTAL_ROUNDS}</span>
            </>
          ) : (
            "No round active"
          )}
        </div>

        <div className={styles.remainingText} translate="no">
          {progress >= 100 ? (
            "🎯 All Tokens Sold - Round Complete!"
          ) : (
            `⏳ ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
          )}
        </div>

        {roundNumber && roundNumber >= TOTAL_ROUNDS && (
          <div className={styles.finalRound} translate="no">
            🎯 This is the final round. No further price increases.
          </div>
        )}

        <div className={styles.priceLine} translate="no">
          <span>
            <img src={bitsLogo} alt="BITS Logo" className={styles.priceLogo} />
          </span>
          {price > 0 ? (
            <span className={styles.currentPriceDisplay}>${currentPrice.toFixed(3)}</span>
          ) : (
            <span className={styles.unavailablePrice}>Unavailable</span>
          )}
        </div>
      </div>

      <div className={styles.timeBoxes} translate="no">
        <TimeBox label="Days" value={timeLeft.days} />
        <TimeBox label="Hours" value={timeLeft.hours} />
        <TimeBox label="Minutes" value={timeLeft.minutes} />
        <TimeBox label="Seconds" value={timeLeft.seconds} />
      </div>

      <TotalRaised totalBoosted={totalBoosted} />
    </div>
  );
};

export default PresaleCountdownFlip;
