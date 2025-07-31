import { erc20Abi } from "viem";
import { useReadContracts } from "wagmi";

export function useTokenDetails(tokenAddress) {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "name",
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      },
    ],
  });

  return {
    name: data?.[0]?.result,
    symbol: data?.[1]?.result,
    decimals: data?.[2]?.result,
    isLoading,
    error,
  };
}
