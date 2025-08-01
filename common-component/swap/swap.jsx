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
  executeTokenSwap,
  pairChecker,
  useMinAmountOut,
} from "@/service/queries";
import { useEthersSigner } from "@/hooks/useEthersSigner";
import { useEthersProvider } from "@/hooks/useEthersProvider";
import { Contract, formatEther, parseUnits } from "ethers";
import { QIEDEXRouter_address } from "@/config/blockchain";

import routerAbi from "@/abi/router.json";
import factoryAbi from "@/abi/factory.json";
import pairABI from "@/abi/pairABI.json";
const validationSchema = Yup.object().shape({
  fromValue: Yup.string().required("From value is required"),
  toValue: Yup.string().required("To value is required"),
});

const BUTTON_STATES = {
  INSUFFICIENT_LIQUIDITY: "INSUFFICIENT LIQUIDITY",
  PAIR_NOT_EXIST: "PAIR NOT EXIST",
};

const SwapComponent = () => {
  const [openModalFrom, setOpenModalFrom] = useState(false);
  const [openModalTo, setOpenModalTo] = useState(false);
  const { address } = useAccount();
  const [historyModalState, setHistoryModalState] = useState(false);
  const [graphModal, setGraphModal] = useState(false);
  const config = useConfig();
  const signer = useEthersSigner();
  const [isButtonActive, setIsButtonActive] = useState(true);
  const [buttonMessage, setButtonMessage] = useState("Execute");

  const provider = useEthersProvider();
  const formik = useFormik({
    initialValues: {
      fromValue: "",
      toValue: "",
      fromCurrency: {},
      toCurrency: {},
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      submissionHandler();
    },
  });

  const fetchMinAmountOut = async () => {
    try {
      const tokenIn = {
        address: formik?.values?.fromCurrency?.address,
        decimals: formik?.values?.fromCurrency?.decimals,
      };
      const tokenOut = {
        address: formik?.values?.toCurrency?.address,
        decimals: formik?.values?.toCurrency?.decimals,
      };
      const amountIn = formik?.values?.fromValue;
      const slippage = 1;

      const router = new Contract(QIEDEXRouter_address, routerAbi, signer);

      const amountInWei = parseUnits(amountIn, tokenIn.decimals);
      const path = [tokenIn.address, tokenOut.address];

      const amountsOut = await router.getAmountsOut(amountInWei, path);
      const expectedOut = amountsOut[1];

      const slippageFactor = 1 - parseFloat(slippage) / 100;
      const slippageFactorBigInt = parseUnits(slippageFactor.toString(), 18);
      const base = parseUnits("1", 18);

      const minOut = (expectedOut * slippageFactorBigInt) / base;
      const ethrValue = formatEther(minOut.toString());
      formik.setFieldValue("toValue", ethrValue);
    } catch (err) {
      console.log(err, "asdasd");
      setError(err);
      setAmountOutMin(null);
    }
  };
  useEffect(() => {
    fetchMinAmountOut();
  }, [formik?.values?.fromValue]);
  const handlerButtonState = async () => {
    try {
      const isNewPair = await pairChecker({
        provider: provider,
        tokenA: formik?.values?.fromCurrency,
        tokenB: formik?.values?.toCurrency,
      });
      if (isNewPair) {
        setIsButtonActive(false);
        setButtonMessage("Pair does not exist");
      } else {
        setIsButtonActive(true);
        setButtonMessage("Execute");
      }
    } catch (error) {
      console.log(error);
      setIsButtonActive(false);
      setButtonMessage("Pair does not exist");
    }
  };

  useEffect(() => {
    handlerButtonState();
  }, [formik.values?.fromCurrency, formik?.values?.toCurrency]);

  const { balance: fromBalance, error } = useTokenBalance({
    tokenAddress: formik?.values?.fromCurrency?.address,
    userAddress: address,
    chainId: formik?.values?.fromCurrency?.chainId,
    rpcUrl: "https://rpc1mainnet.qie.digital",
  });

  const { balance: toBalance } = useTokenBalance({
    tokenAddress: formik?.values?.toCurrency?.address,
    userAddress: address,
    chainId: formik?.values?.toCurrency?.chainId,
    rpcUrl: "https://rpc1mainnet.qie.digital",
  });

  const submissionHandler = async () => {
    try {
      const hash = await executeTokenSwap({
        tokenIn: {
          address: formik?.values?.fromCurrency?.address,
          decimals: formik?.values?.fromCurrency?.decimals,
        },
        tokenOut: {
          address: formik?.values?.toCurrency?.address,
          decimals: formik?.values?.toCurrency?.decimals,
        },
        amountIn: formik?.values?.fromValue,
        slippage: "1",
        signer: signer,
        account: address,
      });
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
                    src={formik.values?.fromCurrency?.icon}
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
              onChange={formik.handleChange}
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
                    src={formik.values?.toCurrency?.icon}
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
              onChange={formik.handleChange}
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
          disabled={isButtonActive}
          onClick={() => {
            // handleClick
            formik.handleSubmit();
          }}
        >
          {buttonMessage}
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
          currentToken={formik?.values?.fromCurrency}
          toToken={formik?.values?.toCurrency}
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
          currentToken={formik?.values?.toCurrency}
          toToken={formik?.values?.fromCurrency}
        />
      )}
    </div>
  );
};

export default SwapComponent;
