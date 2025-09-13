import React, { useEffect, useState, useContext } from "react";
import "../styles/StakingInfoBox.css";
import { getStakingContract } from "../../contract/getStakingContract";
import { getContractInstance } from "../../contract/getContract";
import WalletContext from "../../context/WalletContext";
import { formatUnits } from "ethers/lib/utils";

const formatTime = (sec) => {
  const days = Math.floor(sec / (60 * 60 * 24));
  const hours = Math.floor((sec % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((sec % (60 * 60)) / 60);
  const seconds = sec % 60;
  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
};

const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString();
};

const StakingInfoBox = ({ stakes = [] }) => {
  const { signer } = useContext(WalletContext);
  const [cooldownStatic, setCooldownStatic] = useState(null);
  const [cooldownDisplay, setCooldownDisplay] = useState("Loading...");
  const [unstakeFee, setUnstakeFee] = useState(null);
  const [tgeDate, setTgeDate] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchContractData = async () => {

    try {
      setLoading(true);

      // Prefer robust read-only provider; fallback to signer if missing
      let contract;
      try {
        contract = await getStakingContract(null, true);
      } catch (_) {
        contract = getStakingContract(signer);
      }

      const cd = await contract.cooldown();
      const fee = await contract.unstakeFee();
      const tge = await contract.tgeDate();

      console.log("⏳ Cooldown (seconds):", cd.toString());
      console.log("💰 Unstake Fee (1e18):", fee.toString());
      console.log("📅 TGE Date (timestamp):", tge.toString());
      
      // 🔍 Debug: Check contract APR settings
      try {
        const currentAPR = await contract.currentAPR();
        const currentAPRPercent = await contract.currentAPRPercent();
        const precision = await contract.PRECISION();
        
        console.log("📊 CONTRACT APR DEBUG:");
        console.log("- Current APR (raw):", currentAPR.toString());
        console.log("- Current APR Percent:", currentAPRPercent.toString());  
        console.log("- Precision:", precision.toString());
        console.log("- Correct APR calculation:", (currentAPR.toNumber() / precision.toNumber() * 100).toFixed(2) + "%");
      } catch (err) {
        console.log("❌ Could not fetch contract APR details:", err.message);
      }
      
      // 🔍 Debug: Check BITS token decimals
      try {
        const bitsToken = await getContractInstance("BITS");
        const decimals = await bitsToken.decimals();
        const name = await bitsToken.name();
        const symbol = await bitsToken.symbol();
        
        console.log("💰 BITS TOKEN DEBUG:");
        console.log("- Name:", name);
        console.log("- Symbol:", symbol);
        console.log("- Decimals:", decimals.toString());
        console.log("- Address:", bitsToken.address);
      } catch (err) {
        console.log("❌ Could not fetch BITS token details:", err.message);
      }

      setCooldownStatic(cd.toNumber());
      setUnstakeFee(Number(formatUnits(fee, 16)));
      setTgeDate(tge.toNumber());
    } catch (err) {
      console.error("❌ Error fetching contract data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractData();
  }, [signer]);

  // Calculate cooldown display based on actual stakes
  useEffect(() => {
    console.log("🔍 StakingInfoBox Debug:");
    console.log("- cooldownStatic:", cooldownStatic);
    console.log("- stakes:", stakes);
    console.log("- stakes.length:", stakes?.length);

    if (!cooldownStatic) {
      setCooldownDisplay("Loading...");
      return;
    }

    if (!stakes || stakes.length === 0) {
      console.log("📝 No stakes found, showing general period");
      setCooldownDisplay(`${formatTime(cooldownStatic)} (general period)`);
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      
      // Find the stake with shortest remaining cooldown
      let shortestCooldown = null;
      let shortestTime = Infinity;
      let activeStakesCount = 0;

      stakes.forEach((stake, index) => {
        const aprRaw = stake.apr?.toNumber ? stake.apr.toNumber() : 0;
        
        // ✅ APR calculation fixed: 2000/100 = 20%
        
        const aprCalculated = aprRaw / 100;  // ← CALCULUL CORECT!
        const aprFormatted = aprCalculated.toFixed(2) + "%";
        
        console.log(`🔍 Stake ${index}:`, {
          withdrawn: stake.withdrawn,
          startTime: stake.startTime?.toNumber ? stake.startTime.toNumber() : stake.startTime,
          locked: stake.locked?.toString ? stake.locked.toString() : stake.locked,
          apr: stake.apr?.toString ? stake.apr.toString() : stake.apr,
          aprRaw: aprRaw,
          aprCalculated: aprCalculated,
          aprPercent: aprFormatted,
          lockPeriod: stake.lockPeriod?.toString ? stake.lockPeriod.toString() : stake.lockPeriod,
          autoCompound: stake.autoCompound !== undefined ? stake.autoCompound : "N/A"
        });

        if (!stake.withdrawn) {
          activeStakesCount++;
          const startTime = stake.startTime?.toNumber ? stake.startTime.toNumber() : stake.startTime;
          const stakeEndTime = startTime + cooldownStatic;
          const timeLeft = Math.max(0, stakeEndTime - now);
          
          console.log(`⏰ Stake ${index} cooldown: ${timeLeft} seconds`);
          
          if (timeLeft < shortestTime) {
            shortestTime = timeLeft;
            shortestCooldown = timeLeft;
          }
        }
      });

      console.log(`📊 Active stakes: ${activeStakesCount}, Shortest cooldown: ${shortestCooldown}`);

      if (shortestCooldown !== null) {
        if (shortestCooldown === 0) {
          setCooldownDisplay("Ready to unstake!");
        } else {
          setCooldownDisplay(`${formatTime(shortestCooldown)} (next unlock)`);
        }
      } else {
        setCooldownDisplay("No active stakes");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stakes, cooldownStatic]);

  return (
    <div className="staking-info-container">
      <h3 className="info-title">Staking Information</h3>
      
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Rewards</span>
          <span className="info-value">Continuous earning available</span>
        </div>
        
        <div className="info-item">
          <span className="info-label">Cooldown Period</span>
          <span className="info-value">
            {cooldownDisplay}
          </span>
        </div>
        
        <div className="info-item">
          <span className="info-label">Unstake Fee</span>
          <span className="info-value">
            {unstakeFee !== null ? `${unstakeFee.toFixed(2)}%` : "Loading..."}
          </span>
        </div>
        
        <div className="info-item">
          <span className="info-label">TGE Date</span>
          <span className="info-value">
            {tgeDate !== null ? formatDate(tgeDate) : "Loading..."}
          </span>
        </div>
        
        <div className="info-item">
          <span className="info-label">Custody</span>
          <span className="info-value">Non-custodial protocol</span>
        </div>
      </div>
      
      <button className="info-refresh-btn" onClick={fetchContractData} disabled={loading}>
        {loading ? "Updating..." : "Refresh Data"}
      </button>
    </div>
  );
};

export default StakingInfoBox;
