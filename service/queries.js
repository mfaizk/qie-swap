import { useQuery } from "@tanstack/react-query";

const { api, post } = require("./apiService");
import { Contract, parseUnits, toBigInt } from "ethers";
import { readContract } from "@wagmi/core";

import routerAbi from "@/abi/router.json";
import factoryAbi from "@/abi/factory.json";
import pairABI from "@/abi/pairABI.json";
import {
  QIDEX_Factory_address,
  QIEDEXRouter_address,
} from "@/config/blockchain";
import { erc20Abi } from "viem";
import { useEffect, useState } from "react";

export const uploadTokenLogo = async ({
  file,
  tokenAddress,
  name,
  symbol,
  decimals,
}) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tokenAddress", tokenAddress);
  formData.append("name", name);
  formData.append("symbol", symbol);
  formData.append("decimals", decimals.toString());

  const response = await api({
    method: "POST",
    url: "/upload-logo",
    data: formData,
  });

  return response.data;
};

export const useTokenList = () => {
  return useQuery({
    queryKey: ["tokens"],
    select: (data) => {
      if (data?.status == 200) {
        return [...data?.data?.tokens];
      } else {
        return [];
      }
    },
    queryFn: () => {
      return api({
        url: "/tokenlist",
        method: "GET",
      });
    },
  });
};

export async function addLiquidityERC20Pair({
  tokenA,
  tokenB,
  amountA,
  amountB,
  slippage,
  signer,
  account,
  provider,
}) {
  const routerAddress = QIEDEXRouter_address;
  const factoryAddress = QIDEX_Factory_address;

  const router = new Contract(routerAddress, routerAbi, signer);
  const factory = new Contract(factoryAddress, factoryAbi, provider);

  const amountAParsed = parseUnits(amountA, tokenA.decimals);
  const amountBParsed = parseUnits(amountB, tokenB.decimals);

  let adjustedAmountA = amountAParsed;
  let adjustedAmountB = amountBParsed;

  // 1. Check if pair exists
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
  const isNewPair =
    pairAddress === "0x0000000000000000000000000000000000000000";

  if (!isNewPair) {
    const pair = new Contract(pairAddress, pairABI, provider);
    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();

    const reserveA =
      token0.toLowerCase() === tokenA.address.toLowerCase()
        ? reserve0
        : reserve1;
    const reserveB =
      token0.toLowerCase() === tokenA.address.toLowerCase()
        ? reserve1
        : reserve0;

    adjustedAmountB =
      (adjustedAmountA * toBigInt(reserveB)) / toBigInt(reserveA);
  }

  // 2. Calculate slippage amounts
  const slippagePct = parseFloat(slippage) / 100;
  const slippageFactor = parseUnits((1 - slippagePct).toString(), 18);

  const amountAMin =
    (adjustedAmountA * toBigInt(slippageFactor)) / parseUnits("1", 18);
  const amountBMin =
    (adjustedAmountB * toBigInt(slippageFactor)) / parseUnits("1", 18);

  // 3. Approve tokens
  const tokenAContract = new Contract(tokenA.address, erc20Abi, signer);
  const tokenBContract = new Contract(tokenB.address, erc20Abi, signer);

  const allowanceA = await tokenAContract.allowance(account, routerAddress);
  if (allowanceA < adjustedAmountA) {
    const txA = await tokenAContract.approve(routerAddress, adjustedAmountA);
    await txA.wait();
  }

  const allowanceB = await tokenBContract.allowance(account, routerAddress);
  if (allowanceB < adjustedAmountB) {
    const txB = await tokenBContract.approve(routerAddress, adjustedAmountB);
    await txB.wait();
  }

  // 4. Deadline (10 mins from now)
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

  // 5. Add liquidity
  const tx = await router.addLiquidity(
    tokenA.address,
    tokenB.address,
    adjustedAmountA,
    adjustedAmountB,
    amountAMin,
    amountBMin,
    account,
    deadline
  );

  await tx.wait();

  console.log(
    isNewPair
      ? "🆕 New pair created and liquidity added."
      : "✅ Liquidity added to existing pool."
  );

  return tx;
}

export async function executeTokenSwap({
  tokenIn,
  tokenOut,
  amountIn,
  slippage,
  signer,
  account,
}) {
  const routerAddress = QIEDEXRouter_address;
  const router = new Contract(routerAddress, routerAbi, signer);

  const tokenInContract = new Contract(tokenIn.address, erc20Abi, signer);

  // 1. Convert amountIn to wei
  const amountInWei = parseUnits(amountIn, tokenIn.decimals);

  // 2. Get expected output amount
  const path = [tokenIn.address, tokenOut.address];
  const amountsOut = await router.getAmountsOut(amountInWei, path);
  const expectedOut = amountsOut[1];

  // 3. Calculate minimum output amount with slippage
  const slippageFactor = 1 - parseFloat(slippage) / 100;
  const minOut =
    (expectedOut * parseUnits(slippageFactor.toString(), 18)) /
    parseUnits("1", 18);
  const amountOutMin = minOut;

  // 4. Approve token if needed
  const allowance = await tokenInContract.allowance(account, routerAddress);
  if (allowance < amountInWei) {
    const approveTx = await tokenInContract.approve(routerAddress, amountInWei);
    await approveTx.wait();
  }

  // 5. Set deadline (10 minutes from now)
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

  // 6. Execute the swap
  const tx = await router.swapExactTokensForTokens(
    amountInWei,
    amountOutMin,
    path,
    account,
    deadline
  );

  await tx.wait();
  return tx;
}

export async function pairChecker({ tokenA, tokenB, provider }) {
  try {
    const factoryAddress = QIDEX_Factory_address;
    const factory = new Contract(factoryAddress, factoryAbi, provider);
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
    const isNewPair =
      pairAddress === "0x0000000000000000000000000000000000000000";

    return isNewPair;
  } catch (error) {
    throw false;
  }
}
