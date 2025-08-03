import { Input } from "@/components/ui/input";
import React, { useEffect, useMemo, useState } from "react";
import { IconArrowsDownUp, IconHistory } from "@tabler/icons-react";
import { Button } from "@/components/ui/stateful-button";
import { TokenSelector } from "./token-selector";
import { useFormik } from "formik";
import * as Yup from "yup";
import { HistoryModal } from "./history";
import { GraphModal } from "./graph";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAccount, useConfig } from "wagmi";
import Slider, { Range } from "rc-slider";
import "rc-slider/assets/index.css";
import {
  calculateMinAmountOut,
  checkPairExists,
  getAmountOut,
  getReserves,
  swapHandler,
  useTokenList,
} from "@/service/queries";
import { useEthersSigner } from "@/hooks/useEthersSigner";
import { useEthersProvider } from "@/hooks/useEthersProvider";
import { formatUnits, parseUnits } from "ethers";
import { QIE_BLOCKCHAIN_CONFIG } from "@/config/blockchain";
import { maskValue } from "@/utils";
import { toast } from "sonner";
const marks = {
  0.5: "0.5",
  1: "1",
};
const SwapComponent = () => {
  const [openModalFrom, setOpenModalFrom] = useState(false);
  const [openModalTo, setOpenModalTo] = useState(false);
  const { address } = useAccount();
  const [historyModalState, setHistoryModalState] = useState(false);
  const [graphModal, setGraphModal] = useState(false);
  const config = useConfig();
  const signer = useEthersSigner();
  const provider = useEthersProvider();
  const [fromBalanceState, setFromBalanceState] = useState();
  const [currentTx, setCurrentTx] = useState("");
  const [buttonState, setbuttonState] = useState({
    isValid: false,
    message: "Swap",
  });

  const validationSchema = Yup.object().shape({
    fromValue: Yup.string()
      .required("value is required")
      .test(
        "is-positive",
        "Amount must be greater than 0",
        (value) => Number(value) > 0
      )
      .test(
        "has-enough-balance",
        "Insufficient balance",
        (value) => Number(value) <= Number(fromBalanceState)
      ),
    toValue: Yup.string().required("To value is required"),
    slippage: Yup.number()
      .required("Slippage is required")
      .min(0.5, "Slippage must be at least 0.5")
      .max(1, "Slippage cannot be more than 1"),
  });

  const { data: tokenListData, isLoading: tokenListLoading } = useTokenList();

  const formik = useFormik({
    initialValues: {
      fromValue: "",
      toValue: "",
      slippage: 0.5,
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
  useEffect(() => {
    setFromBalanceState(fromBalance);
  }, [fromBalance]);

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
      const minAmountOut = calculateMinAmountOut(
        expectedAmountOut,
        formik?.values?.slippage
      );
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
      setbuttonState({
        isValid: false,
        message: "Please wait...",
      });
      const tx = await swapHandler({
        account: address,
        amountIn: fromValueInWei,
        amountOutMin: toValueInWei,
        path: path,
        provider: provider,
        signer: signer,
      });
      setCurrentTx(tx?.hash);

      await refetchFromBalance();
      await refetchToBalance();
      setbuttonState({
        isValid: true,
        message: "Swap",
      });
      toast.success("Transaction successful");
    } catch (error) {
      console.log(error);
      toast.error(error?.shortMessage || "Transaction Failed");
      setbuttonState({
        isValid: true,
        message: "Swap",
      });
    }
  };

  const tokenList = useMemo(() => {
    return {
      fromTokenList: tokenListData?.filter(
        (item) => item?.address != formik?.values?.toCurrency?.address
      ),
      toTokenList: tokenListData?.filter(
        (item) => item?.address != formik?.values?.fromCurrency?.address
      ),
    };
  }, [tokenListData, formik.values]);

  return (
    <div className="flex items-center justify-center flex-col bg-muted/20 mt-10 w-full md:w-[600px] min-h-[500px] rounded-2xl backdrop-blur-3xl ring ring-[#ff136d] py-10 relative">
      <div className="w-full flex justify-center items-center px-12">
        {/* <p
          className=" text-xs font-light cursor-pointer"
          onClick={() => setGraphModal(true)}
        >
          Show Graph
        </p> */}
        <h2 className="text-2xl font-semibold">Trade Token</h2>
        {/* <IconHistory
          className="cursor-pointer"
          onClick={() => setHistoryModalState(true)}
        /> */}
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
                const item = e?.currentTarget?.value;
                const decimal = 8;
                const regex = new RegExp(`^(\\d*(\\.\\d{0,${decimal}})?)?$`);
                if (regex.test(item)) {
                  formik.handleChange(e);
                  getToAmount(e?.target?.value);
                }
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
        <div className="flex gap-2 flex-col w-full my-12">
          <p>Slippage</p>
          <div className="mx-2">
            <Slider
              min={0.5}
              max={1}
              step={0.5}
              marks={marks}
              defaultValue={formik?.values?.slippage}
              onChange={(val) => {
                formik.setFieldValue("slippage", val);
              }}
              trackStyle={{ backgroundColor: "rgb(255 19 109)", height: 6 }} // blue
              handleStyle={{
                borderColor: "rgb(255 19 109)",
                backgroundColor: "rgb(255 19 109)",
              }}
              railStyle={{ backgroundColor: "#1f1f1f", height: 6 }}
            />
          </div>
        </div>{" "}
        {currentTx && (
          <div className="w-full my-4 flex flex-row justify-between">
            <p>Transaction Hash:</p>
            <p
              className="text-brand underline cursor-pointer"
              onClick={() => {
                window.open(
                  `https://mainnet.qie.digital/tx/${currentTx}`,
                  "_blank"
                );
              }}
            >
              {maskValue({
                str: currentTx,
                enableCopyButton: false,
              })}
            </p>
          </div>
        )}
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
          tokenList={tokenList?.fromTokenList}
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
          tokenList={tokenList?.toTokenList}
        />
      )}
    </div>
  );
};

export default SwapComponent;
