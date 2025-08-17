// CSS imports - Must be first
import "./PresalePage.css";
import "./PaymentBox/PaymentBox.css";
import "./PaymentBox/InputBox.css";
import "./PaymentBox/PaymentSummary.css";

import React, { useState, useEffect, Suspense, lazy } from "react";
import { ethers } from "ethers";
import SelectPaymentMethod from "./SelectPaymentMethod";
import { useSelectedToken } from "./hooks/useSelectedToken";
import useTokenPrices from "./prices/useTokenPrices";
import AdjustFontButton from "../components/AdjustFontButton";

// Lazy loaded components for better performance
const PaymentBox = lazy(() => import("./PaymentBox/PaymentBox"));
const PresaleDashboard = lazy(() => import("./Timer/PresaleDashboard"));
const ReferralRewardBox = lazy(() => import("./Rewards/ReferralRewardBox"));
const BoosterSummary = lazy(() => import("./BoosterSummary/BoosterSummary"));

// Loading component for Presale
const PresaleLoading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '1rem',
    color: '#fff',
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '10px'
  }}>
    Loading component...
  </div>
);

const PresalePage = () => {
  const {
    selectedToken,
    selectedChain,
    setSelectedToken,
    setSelectedChain,
  } = useSelectedToken();

  const { prices: tokenPrices } = useTokenPrices();
  const [amountPay, setAmountPay] = useState(0);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    const detectWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setWalletAddress(accounts[0]);
        } catch (err) {
          console.warn("🦊 Wallet not connected");
        }
      }
    };

    detectWallet();
  }, []);

  useEffect(() => {
    const header = document.querySelector(".header");
    const handleScroll = () => {
      if (window.scrollY < 30) {
        header?.classList.add("transparent-header");
      } else {
        header?.classList.remove("transparent-header");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="presale-page">
      <div className="presale-wrapper">
        <div className="presale-grid">
          {/* Select Token/Chain */}
          <div className="grid-select">
            <SelectPaymentMethod
              selectedToken={selectedToken}
              onSelectToken={setSelectedToken}
              selectedChain={selectedChain}
              onSelectChain={setSelectedChain}
            />
          </div>

          {/* Payment */}
          <div className="grid-payment card-box">
            <Suspense fallback={<PresaleLoading />}>
              <PaymentBox
                selectedToken={selectedToken}
                selectedChain={selectedChain}
                amountPay={amountPay}
                setAmountPay={setAmountPay}
                tokenPrices={tokenPrices}
                walletAddress={walletAddress}
              />
            </Suspense>
          </div>

          {/* Presale Timer Panel */}
          <div className="grid-panel card-box">
            <div className="sticky-wrapper">
              <Suspense fallback={<PresaleLoading />}>
                <PresaleDashboard />
              </Suspense>
            </div>
          </div>

          {/* Referral */}
          <div className="grid-claim card-box">
            <Suspense fallback={<PresaleLoading />}>
              <ReferralRewardBox walletAddress={walletAddress} />
            </Suspense>
          </div>

          {/* Booster Summary */}
          <div className="grid-summary card-box">
            <Suspense fallback={<PresaleLoading />}>
              <BoosterSummary />
            </Suspense>
          </div>

        </div>

        {/* Adjust Font Button */}
        <AdjustFontButton />
      </div>
    </div>
  );
};

export default PresalePage;
