import { useEffect, useState } from "react";
import { getStakingContract } from "../contract/getStakingContract";
import { ethers } from "ethers";

export const useStakingData = (signer, userAddress) => {
  const [stakes, setStakes] = useState([]);
  const [totalStaked, setTotalStaked] = useState(ethers.BigNumber.from(0));
  const [totalReward, setTotalReward] = useState(ethers.BigNumber.from(0));

  useEffect(() => {
    if (!signer || !userAddress) return;

    const fetchStakes = async () => {
      try {
        const contract = getStakingContract(signer);
        const rawStakes = await contract.getStakeByUser(userAddress);
        const PRECISION = await contract.PRECISION();
        const SECONDS_IN_YEAR = await contract.SECONDS_IN_YEAR();

              let totalSt = ethers.BigNumber.from(0);
      let totalRw = ethers.BigNumber.from(0);

        const now = Math.floor(Date.now() / 1000);

        const formattedStakes = rawStakes.map((s) => {
          const duration = now - s.updatedAt.toNumber();
          const reward = s.locked
            .mul(s.apr)
            .mul(duration)
            .div(SECONDS_IN_YEAR)
            .div(PRECISION);

          if (!s.withdrawn) {
            totalSt = totalSt.add(s.locked);
            totalRw = totalRw.add(reward);
          }

          return {
            locked: s.locked,
            apr: s.apr,
            updatedAt: s.updatedAt,
            startTime: s.startTime,
            withdrawn: s.withdrawn,
            reward,
          };
        });

        setStakes(formattedStakes);
        setTotalStaked(totalSt);
        setTotalReward(totalRw);
      } catch (err) {
        console.error("❌ Error fetching staking data:", err);
      }
    };

    fetchStakes();
  }, [signer, userAddress]);

  return { stakes, totalStaked, totalReward };
};
