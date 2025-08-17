// src/components/SelectPaymentMethod/hooks/useFetchSolanaBalances.js
import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

const useFetchSolanaBalances = (solanaWalletAddress) => {
    const [balances, setBalances] = useState({});

    useEffect(() => {
        const fetchSolanaBalances = async () => {
            if (!solanaWalletAddress) return;
            try {
                const connection = new Connection("https://api.devnet.solana.com");
                const walletPublicKey = new PublicKey(solanaWalletAddress);

                const lamports = await connection.getBalance(walletPublicKey);
                const solBalance = lamports / 1e9; // Convert from lamports to SOL

                setBalances({ SOL: solBalance });
            } catch (error) {
                console.error("Failed to fetch Solana balances:", error);
            }
        };

        fetchSolanaBalances();
    }, [solanaWalletAddress]);

    return balances;
};

export default useFetchSolanaBalances;

