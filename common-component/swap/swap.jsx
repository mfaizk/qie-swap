import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { IconArrowsDownUp, IconHistory } from "@tabler/icons-react";
import { Button } from "@/components/ui/stateful-button";
import { TokenSelector } from "./token-selector";
import { useFormik } from "formik";
import * as Yup from "yup";
import { HistoryModal } from "./history";
import { GraphModal } from "./graph";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAccount, useConfig } from "wagmi";
import {
  calculateMinAmountOut,
  checkPairExists,
  executeTokenSwap,
  getAmountOut,
  getReserves,
  handleSwapCalculation,
  pairChecker,
  swapHandler,
  useMinAmountOut,
  useTokenList,
} from "@/service/queries";
import { useEthersSigner } from "@/hooks/useEthersSigner";
import { useEthersProvider } from "@/hooks/useEthersProvider";
import {
  Contract,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from "ethers";
import {
  QIE_BLOCKCHAIN_CONFIG,
  QIEDEXRouter_address,
} from "@/config/blockchain";

import routerAbi from "@/abi/router.json";
import factoryAbi from "@/abi/factory.json";
import pairABI from "@/abi/pairABI.json";
const validationSchema = Yup.object().shape({
  fromValue: Yup.string().required("From value is required"),
  toValue: Yup.string().required("To value is required"),
});

const SwapComponent = () => {
  const [openModalFrom, setOpenModalFrom] = useState(false);
  const [openModalTo, setOpenModalTo] = useState(false);
  const { address } = useAccount();
  const [historyModalState, setHistoryModalState] = useState(false);
  const [graphModal, setGraphModal] = useState(false);
  const config = useConfig();
  const signer = useEthersSigner();
  const provider = useEthersProvider();
  const [buttonState, setbuttonState] = useState({
    isValid: false,
    message: "Swap",
  });

  const { data: tokenListData, isLoading: tokenListLoading } = useTokenList();

  const formik = useFormik({
    initialValues: {
      fromValue: "",
      toValue: "",
      fromCurrency: {},
      toCurrency: {},
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      submissionHandler(values);
    },
  });

  const {
    balance: fromBalance,
    error,
    refetch: refetchFromBalance,
  } = useTokenBalance({
    tokenAddress: formik?.values?.fromCurrency?.address,
    userAddress: address,
    chainId: formik?.values?.fromCurrency?.chainId,
    rpcUrl: QIE_BLOCKCHAIN_CONFIG.rpc,
  });

  const { balance: toBalance, refetch: refetchToBalance } = useTokenBalance({
    tokenAddress: formik?.values?.toCurrency?.address,
    userAddress: address,
    chainId: formik?.values?.toCurrency?.chainId,
    rpcUrl: QIE_BLOCKCHAIN_CONFIG.rpc,
  });

  const getToAmount = async (value) => {
    try {
      const tokenIn = formik?.values?.fromCurrency?.address;
      const tokenOut = formik?.values?.toCurrency?.address;
      const valueInWei = parseUnits(value);

      const expectedAmountOut = await getAmountOut(
        valueInWei,
        tokenIn,
        tokenOut,
        provider
      );
      const minAmountOut = calculateMinAmountOut(expectedAmountOut, 1);
      const amountOutInEther = formatUnits(minAmountOut);
      formik.setFieldValue("toValue", amountOutInEther);

      const pairAddress = await checkPairExists(tokenIn, tokenOut, provider);

      if (!pairAddress) {
        setbuttonState({
          isValid: false,
          message: "Pair does not exist",
        });
        return;
      }

      const { reserveOut } = await getReserves(pairAddress, tokenIn, provider);
      const amountOreserveOut = formatUnits(reserveOut);

      if (expectedAmountOut > reserveOut) {
        setbuttonState({
          isValid: false,
          message: "Insufficient liquidity",
        });
        return;
      }

      setbuttonState({
        isValid: true,
        message: "Swap",
      });
    } catch (error) {
      console.log(error, "errror");
    }
  };

  const submissionHandler = async (values) => {
    try {
      const fromValueInWei = parseUnits(values?.fromValue);
      const toValueInWei = parseUnits(values?.toValue);

      const path = [values?.fromCurrency?.address, values?.toCurrency?.address];

      const tx = await swapHandler({
        account: address,
        amountIn: fromValueInWei,
        amountOutMin: toValueInWei,
        path: path,
        provider: provider,
        signer: signer,
      });
      await refetchFromBalance();
      await refetchToBalance();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex items-center justify-center flex-col bg-muted/20 mt-10 w-full md:w-[600px] min-h-[500px] rounded-2xl backdrop-blur-3xl ring ring-[#ff136d] py-10 relative">
      <div className="w-full flex justify-between items-center px-12">
        <p
          className=" text-xs font-light cursor-pointer"
          onClick={() => setGraphModal(true)}
        >
          Show Graph
        </p>
        <h2 className="text-2xl font-semibold">Trade Token</h2>
        <IconHistory
          className="cursor-pointer"
          onClick={() => setHistoryModalState(true)}
        />
      </div>

      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex gap-2 flex-col w-full">
          <div className="mt-20 relative flex items-center w-full ">
            <div
              className="absolute border h-[80%] w-32 md:w-36 flex justify-start items-center ml-2 rounded-md cursor-pointer ring ring-ring/10 px-3"
              onClick={() => {
                setOpenModalFrom(true);
              }}
            >
              {formik.values?.fromCurrency?.symbol ? (
                <div className="flex items-center gap-2">
                  <img
                    src={formik.values?.fromCurrency?.logoURI}
                    alt=""
                    className="object-contain h-4"
                  />
                  <p className="text-xs md:text-sm">
                    {formik.values?.fromCurrency?.symbol}
                  </p>
                </div>
              ) : (
                <p className="text-xs md:text-sm">Select a currency</p>
              )}
            </div>
            <Input
              type="text"
              name="fromValue"
              onChange={(e) => {
                formik.handleChange(e);
                getToAmount(e?.target?.value);
              }}
              value={formik.values.fromValue}
              placeholder="0.00"
              className={"h-14 w-full md:w-lg pl-36 md:pl-40"}
            />
          </div>
          <div className="px-2 flex justify-between items-center">
            <p className="text-xs text-red-500">{formik?.errors?.fromValue}</p>
            <div className="flex gap-2">
              <p className="text-xs">
                {fromBalance} {formik?.values?.fromCurrency?.symbol}
              </p>
              <button className="text-xs">Max</button>
            </div>
          </div>
        </div>
        <IconArrowsDownUp />
        <div className="flex gap-2 flex-col w-full">
          <div className="mt-6 relative flex items-center w-full ">
            <div
              className="absolute border h-[80%] w-32 md:w-36 flex justify-start items-center ml-2 rounded-md cursor-pointer ring ring-ring/10 px-3"
              onClick={() => {
                setOpenModalTo(true);
              }}
            >
              {formik.values?.toCurrency?.symbol ? (
                <div className="flex items-center gap-2">
                  <img
                    src={formik.values?.toCurrency?.logoURI}
                    alt=""
                    className="object-contain h-4"
                  />
                  <p className="text-xs md:text-sm">
                    {formik.values?.toCurrency?.symbol}
                  </p>
                </div>
              ) : (
                <p className="text-xs md:text-sm">Select a currency</p>
              )}
            </div>
            <Input
              name="toValue"
              // onChange={formik.handleChange}
              value={formik.values.toValue}
              type="text"
              placeholder="0.00"
              className={"h-14 w-full md:w-lg pl-36 md:pl-40"}
            />
          </div>
          <div className="px-2 flex justify-between items-center">
            <p className="text-xs text-red-500"> {formik?.errors?.toValue}</p>
            <div className="flex gap-2">
              <p className="text-xs">
                {toBalance} {formik?.values?.toCurrency?.symbol}
              </p>
              <button className="text-xs">Max</button>
            </div>
          </div>
        </div>
        <div className="w-full my-10 flex flex-col gap-2">
          <div className="flex flex-row justify-between items-center w-full">
            <p>Average Price</p>
            <p>0.00</p>
          </div>
          <div className="flex flex-row justify-between items-center w-full">
            <p>Average Price</p>
            <p>0.00</p>
          </div>
        </div>

        <Button
          className={
            "text-xl border w-full rounded h-14 cursor-pointer bg-transparent"
          }
          onClick={() => {
            if (buttonState?.isValid) {
              formik.handleSubmit();
            }
          }}
        >
          {`${buttonState?.message}`}
        </Button>
      </div>

      <HistoryModal
        openModal={historyModalState}
        setOpenModal={setHistoryModalState}
      />
      <GraphModal openModal={graphModal} setOpenModal={setGraphModal} />
      {openModalFrom && (
        <TokenSelector
          openModal={openModalFrom}
          setOpenModal={setOpenModalFrom}
          onChange={(val) => {
            formik.setFieldValue("fromCurrency", val);
            setOpenModalFrom(false);
          }}
          tokenList={tokenListData}
        />
      )}
      {openModalTo && (
        <TokenSelector
          openModal={openModalTo}
          setOpenModal={setOpenModalTo}
          onChange={(val) => {
            formik.setFieldValue("toCurrency", val);
            setOpenModalTo(false);
          }}
          tokenList={tokenListData}
        />
      )}
    </div>
  );
};

export default SwapComponent;
