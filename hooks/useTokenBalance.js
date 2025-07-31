"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { erc20Abi } from "viem";

/**
 * Hook to fetch token balance (Native or ERC-20) using ethers.js
 *
 * @param {Object} params
 * @param {string} params.tokenAddress - ERC-20 token address (optional for native)
 * @param {number} params.chainId - Chain ID of the network
 * @param {string} params.userAddress - Wallet address to check balance
 * @param {string} params.rpcUrl - RPC URL to use for ethers.js provider
 */
export const useTokenBalance = ({
  tokenAddress,
  chainId,
  userAddress,
  rpcUrl,
}) => {
  const isNative = !tokenAddress;

  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async () => {
    if (!userAddress || !chainId || !rpcUrl) {
      setError("Missing required parameters");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      if (isNative) {
        const nativeBalance = await provider.getBalance(userAddress);
        const formatted = ethers.formatUnits(nativeBalance, 18);
        setBalance(formatted.slice(0, 6));
      } else {
        const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
        const rawBalance = await contract.balanceOf(userAddress);
        const decimals =
          typeof contract.decimals === "function"
            ? await contract.decimals().catch(() => 18)
            : 18;

        const formatted = ethers.formatUnits(rawBalance, decimals);
        setBalance(formatted.slice(0, 6));
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError("Failed to fetch balance");
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [userAddress, chainId, tokenAddress, isNative, rpcUrl]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
  };
};
