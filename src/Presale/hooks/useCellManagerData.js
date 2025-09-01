import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";

/**
 * Hook to fetch data directly from CellManager contract
 * This replaces backend API calls for getting current round data
 */
export default function useCellManagerData() {
  const [data, setData] = useState({
    currentPrice: null,
    roundNumber: null,
    availableBits: null,
    soldBits: null,
    cellId: null,
    loading: true,
    error: null,
    history: [] // Add history array
  });

  useEffect(() => {
    const fetchCellManagerData = async () => {
      console.groupCollapsed("📊 [useCellManagerData] Fetching data from CellManager");
      
      try {
        const IS_TESTNET = true; // sau din .env
        
        const rpcUrl = IS_TESTNET
          ? "https://data-seed-prebsc-1-s1.binance.org:8545/"
          : "https://bsc-dataseed.binance.org/";
          
        console.log("🌐 Using RPC:", rpcUrl);
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

        const contractAddress = CONTRACTS.CELL_MANAGER?.address;
        console.log("📋 CellManager address:", contractAddress);
        
        if (!contractAddress) {
          throw new Error("Missing CellManager contract address");
        }
        
        // Test provider connection
        const blockNumber = await provider.getBlockNumber();
        console.log("🔗 Connected to block:", blockNumber);

        const abi = [
          "function getCurrentOpenCellId() view returns (uint256)",
          "function getNextCellId() view returns (uint256)",
          "function getCell(uint256) view returns (tuple(bool defined, uint8 cellState, uint256 standardPrice, uint256 privilegedPrice, uint256 sold, uint256 supply))",
          "function getCurrentBitsPriceUSD(address wallet) view returns (uint256)",
          "function getRemainingSupply(uint256 cellId) view returns (uint256)",
          "function getTotalSoldInCell(uint256 cellId) view returns (uint256)",
          "function debugCellState(uint256 cellId) view returns (bool defined, uint8 state, uint256 standardPrice, uint256 privilegedPrice, uint256 sold, uint256 supply)"
        ];

        const contract = new ethers.Contract(contractAddress, abi, provider);

        // Get current open cell ID and next cell ID
        const cellId = await contract.getCurrentOpenCellId();
        const nextCellId = await contract.getNextCellId();
        console.log("📦 Current Open Cell ID:", cellId.toString());
        console.log("📦 Next Cell ID:", nextCellId.toString());

        // Get history of all cells
        const history = [];
        const totalCells = parseInt(nextCellId.toString());
        
        console.log("📚 Fetching history for", totalCells, "cells...");
        
        for (let i = 0; i < totalCells; i++) {
          try {
            const [defined, state, standardPriceRaw, privilegedPriceRaw, sold, supply] = await contract.debugCellState(i);
            
            if (defined) {
              const realSoldBits = Math.round(parseFloat(ethers.utils.formatUnits(sold, 18)));
              const realPrice = parseFloat((standardPriceRaw / 1000).toFixed(6));
              const realRaisedUSD = realSoldBits * realPrice;
              const tokensAvailable = Math.round(parseFloat(ethers.utils.formatUnits(supply.sub(sold), 18)));
              
              const cellHistory = {
                id: i,
                round: i + 1, // Round number is cellId + 1
                start_time: new Date().toISOString(), // We don't have exact start time from contract
                end_time: state === 2 ? new Date().toISOString() : null, // Assuming state 2 = closed
                price: realPrice,
                // REAL data from blockchain
                real_sold_bits: realSoldBits,
                real_raised_usd: realRaisedUSD,
                tokensavailable: tokensAvailable,
                // Legacy fields for compatibility (will be replaced)
                sold_bits: realSoldBits,
                raised_usd: realRaisedUSD,
                last_update: new Date().toISOString(),
                data_source: "CellManager Contract (Real Sales Only)"
              };
              
              history.push(cellHistory);
              console.log(`📊 Cell ${i}:`, cellHistory);
            }
          } catch (cellErr) {
            console.warn(`⚠️ Could not fetch cell ${i}:`, cellErr.message);
          }
        }

        // Use current cell data for main display
        let [defined, state, standardPriceRaw, privilegedPriceRaw, sold, supply] = await contract.debugCellState(cellId);
        
        // If current cell is empty, try to find the last cell with data
        if (!defined || (supply.toString() === "0" && sold.toString() === "0")) {
          console.warn(`⚠️ Cell ${cellId} is empty, searching for last active cell...`);
          
          // Search backwards from current cell to find one with data
          for (let i = parseInt(cellId.toString()) - 1; i >= 0; i--) {
            try {
              const [prevDefined, prevState, prevStandardPrice, prevPrivilegedPrice, prevSold, prevSupply] = await contract.debugCellState(i);
              
              if (prevDefined && (prevSupply.toString() !== "0" || prevSold.toString() !== "0")) {
                console.log(`✅ Found active cell ${i} with data`);
                defined = prevDefined;
                state = prevState;
                standardPriceRaw = prevStandardPrice;
                privilegedPriceRaw = prevPrivilegedPrice;
                sold = prevSold;
                supply = prevSupply;
                break;
              }
            } catch (err) {
              console.warn(`Could not check cell ${i}:`, err.message);
            }
          }
        }
        
        console.log("🔍 Debug Cell State:", {
          defined,
          state: state.toString(),
          standardPriceRaw: standardPriceRaw.toString(),
          privilegedPriceRaw: privilegedPriceRaw.toString(),
          sold: sold.toString(),
          supply: supply.toString()
        });
        
        // Convert price from millicents to USD (divide by 1000)
        const standardPrice = parseFloat((standardPriceRaw / 1000).toFixed(6));
        
        // Try to get current BITS price USD with a dummy wallet address
        let currentBitsPriceUSD = standardPrice;
        try {
          const dummyWallet = "0x0000000000000000000000000000000000000001";
          const bitsPriceRaw = await contract.getCurrentBitsPriceUSD(dummyWallet);
          
          console.log("🔍 [DEBUG] Price conversion:");
          console.log("- bitsPriceRaw (from contract):", bitsPriceRaw.toString());
          console.log("- standardPriceRaw (from debugCellState):", standardPriceRaw.toString());
          console.log("- standardPrice (after /1000):", standardPrice);
          
          // Check if bitsPriceRaw needs different conversion
          const priceFromContract = parseFloat((bitsPriceRaw / 1000).toFixed(6));
          console.log("- priceFromContract (after /1000):", priceFromContract);
          
          // Use standardPrice if getCurrentBitsPriceUSD returns wrong format
          if (priceFromContract > 1) {
            console.warn("⚠️ getCurrentBitsPriceUSD returned large value, using standardPrice instead");
            currentBitsPriceUSD = standardPrice;
          } else if (priceFromContract > 0) {
            currentBitsPriceUSD = priceFromContract;
          } else {
            console.warn("⚠️ getCurrentBitsPriceUSD returned 0 or negative, using standardPrice instead");
            currentBitsPriceUSD = standardPrice;
          }
          
          console.log("💰 Final Current BITS Price USD:", currentBitsPriceUSD);
        } catch (priceErr) {
          console.warn("⚠️ Could not get getCurrentBitsPriceUSD, using standardPrice:", priceErr.message);
        }
        
        // Calculate available BITS (supply - sold)
        const availableBits = supply.sub(sold);
        
        // Get remaining supply directly
        const remainingSupply = await contract.getRemainingSupply(cellId);
        
        // Get total sold for verification
        const totalSold = await contract.getTotalSoldInCell(cellId);
        
        console.log("📊 Remaining Supply (wei):", remainingSupply.toString());
        console.log("📊 Total Sold (wei):", totalSold.toString());
        console.log("📊 Supply (wei):", supply.toString());
        console.log("📊 Sold (wei):", sold.toString());
        console.log("📊 Available calculated (wei):", availableBits.toString());
        
        // Verify calculations match
        console.log("🔍 Verification:");
        console.log("- remainingSupply + totalSold should equal supply");
        console.log("- remainingSupply:", ethers.utils.formatUnits(remainingSupply, 18));
        console.log("- totalSold:", ethers.utils.formatUnits(totalSold, 18));
        console.log("- supply:", ethers.utils.formatUnits(supply, 18));
        console.log("- sold (debugCellState):", ethers.utils.formatUnits(sold, 18));
        
        // Convert wei to BITS properly (keep precision)
        const soldBitsFormatted = parseFloat(ethers.utils.formatUnits(sold, 18));
        const supplyFormatted = parseFloat(ethers.utils.formatUnits(supply, 18));
        
        // Use direct calculation if getRemainingSupply returns 0 but supply > sold
        let availableBitsFormatted = parseFloat(ethers.utils.formatUnits(remainingSupply, 18));
        
        if (availableBitsFormatted === 0 && supplyFormatted > soldBitsFormatted) {
          availableBitsFormatted = supplyFormatted - soldBitsFormatted;
          console.log(`🔧 Using calculated available: ${availableBitsFormatted} (supply: ${supplyFormatted} - sold: ${soldBitsFormatted})`);
        }
        
        console.log("📊 Final Cell Data:", {
          cellId: cellId.toString(),
          defined,
          state: state.toString(),
          standardPrice,
          supply: supplyFormatted,
          sold: soldBitsFormatted,
          available: availableBitsFormatted,
          remainingSupply: availableBitsFormatted
        });

        // Additional debugging for zero values
        if (supplyFormatted === 0 && soldBitsFormatted === 0) {
          console.warn("⚠️ [DEBUG] Cell has zero supply and sold - this might be an empty cell");
          console.log("Raw values from debugCellState:");
          console.log("- defined:", defined);
          console.log("- state:", state.toString());
          console.log("- supply (raw):", supply.toString());
          console.log("- sold (raw):", sold.toString());
          console.log("- remainingSupply (raw):", remainingSupply.toString());
          console.log("- totalSold (raw):", totalSold.toString());
          
          console.log("🔍 [SOLUTION] To fix this:");
          console.log("1. Set BITS supply in CellManager contract for cell", cellId.toString());
          console.log("2. Or use AdminPanel to set simulation supply in database");
          console.log("3. Current cell might not have been configured with BITS yet");
        }

        setData({
          currentPrice: currentBitsPriceUSD,
          roundNumber: parseInt(cellId.toString()) + 1, // Round number is cellId + 1
          availableBits: Math.round(availableBitsFormatted), // Round to avoid floating point issues
          soldBits: Math.round(soldBitsFormatted),
          cellId: parseInt(cellId.toString()),
          loading: false,
          error: null,
          history: history // Include the complete history
        });

      } catch (err) {
        console.error("❌ [useCellManagerData] Failed to fetch data:", err.message || err);
        setData(prev => ({
          ...prev,
          loading: false,
          error: "Failed to fetch CellManager data"
        }));
      } finally {
        console.groupEnd();
      }
    };

    fetchCellManagerData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchCellManagerData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return data;
}
