// src/Presale/PaymentBox/InputBox.js

import React, { useEffect, useState } from "react";
import "./InputBox.css";
import { FaPlus, FaMinus } from "react-icons/fa";
import { GiBroom, GiWallet } from "react-icons/gi";

const InputBox = ({ amountPay, setAmountPay, userBalance, selectedToken }) => {
  // 🌟 Different minimum amounts for different tokens
  const MIN_AMOUNT = (selectedToken === "SOL") ? 0.001 : 
                     (selectedToken === "USDC-Solana") ? 0.01 : 0.01;
 const [internalValue, setInternalValue] = useState(
  typeof amountPay === "number" && !isNaN(amountPay) ? amountPay : MIN_AMOUNT
);


  useEffect(() => {
    if (typeof amountPay !== "number" || isNaN(amountPay)) return;

    let timer;

    if (internalValue < amountPay) {
      timer = setInterval(() => {
        setInternalValue((prev) => {
          const nextValue = parseFloat((prev + 0.01).toFixed(2));
          if (nextValue >= amountPay) {
            clearInterval(timer);
            return amountPay;
          }
          return nextValue;
        });
      }, 50);
    } else if (internalValue !== amountPay) {
      setInternalValue(amountPay);
    }

    return () => clearInterval(timer);
  }, [amountPay, internalValue]);

  const handleInputChange = (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value < MIN_AMOUNT) {
      value = MIN_AMOUNT;
    }
    setAmountPay(value);
  };

  const handleIncrement = () => {
    const step = (selectedToken === "SOL") ? 0.001 : 
                 (selectedToken === "USDC-Solana") ? 0.01 : 0.01;
    const decimals = (selectedToken === "SOL") ? 3 : 
                     (selectedToken === "USDC-Solana") ? 2 : 2;
    setAmountPay((prev) => parseFloat((prev + step).toFixed(decimals)));
  };

  const handleDecrement = () => {
    const step = (selectedToken === "SOL") ? 0.001 : 
                 (selectedToken === "USDC-Solana") ? 0.01 : 0.01;
    const decimals = (selectedToken === "SOL") ? 3 : 
                     (selectedToken === "USDC-Solana") ? 2 : 2;
    setAmountPay((prev) =>
      prev > MIN_AMOUNT ? parseFloat((prev - step).toFixed(decimals)) : MIN_AMOUNT
    );
  };

  const handleErase = () => {
    setAmountPay(MIN_AMOUNT);
  };

  const handleMax = () => {
    const maxValue = parseFloat(userBalance?.toFixed(6) || "0.00");
    setAmountPay(maxValue);
  };

  const decimals = selectedToken === "SOL" ? 3 : 2;
  const defaultValue = selectedToken === "SOL" ? "0.001" : "0.01";
  const safeValue = isNaN(internalValue) || internalValue <= 0 ? defaultValue : internalValue.toFixed(decimals);

  return (
    <div className="cosmic-input-container">
      <div className="cosmic-input-wrapper">
        <input
          type="text"
          value={safeValue}
          onChange={handleInputChange}
          placeholder="0.00"
          className="cosmic-input"
        />
      </div>

      <div className="action-buttons">
        <button type="button" onClick={handleDecrement} className="cosmic-button">
          <FaMinus />
        </button>
        <button type="button" onClick={handleIncrement} className="cosmic-button">
          <FaPlus />
        </button>
        <button type="button" onClick={handleErase} className="cosmic-button">
          <GiBroom />
        </button>
        <button type="button" onClick={handleMax} className="cosmic-button">
          <GiWallet />
        </button>
      </div>
    </div>
  );
};

export default InputBox;
