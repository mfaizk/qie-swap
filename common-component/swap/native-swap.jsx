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
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { executeTokenSwap, pairChecker, useTokenList } from "@/service/queries";
import { useEthersSigner } from "@/hooks/useEthersSigner";
import { useEthersProvider } from "@/hooks/useEthersProvider";
import { Contract, formatEther, parseUnits } from "ethers";
import WQIAbi from "@/abi/wqieABI.json";
import {
  QIE_BLOCKCHAIN_CONFIG,
  QIE_TOKEN,
  QIEDEXRouter_address,
  WQIE_address,
  WQIE_TOKEN,
} from "@/config/blockchain";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { toast } from "sonner";
import { maskValue } from "@/utils";

const BUTTON_STATES = {
  INSUFFICIENT_LIQUIDITY: "INSUFFICIENT LIQUIDITY",
  PAIR_NOT_EXIST: "PAIR NOT EXIST",
};

const NativeSwap = () => {
  const [openModalFrom, setOpenModalFrom] = useState(false);
  const { address } = useAccount();
  const [historyModalState, setHistoryModalState] = useState(false);
  const [graphModal, setGraphModal] = useState(false);
  const config = useConfig();
  const [currentTx, setCurrentTx] = useState("");
  const { data: tokenListData, isLoading: tokenListLoading } = useTokenList();
  const [formBalanceState, setFormBalanceState] = useState(0);

  const {
    writeContractAsync,
    status,
    isPending: writeContractPending,
  } = useWriteContract({});

  const validationSchema = Yup.object().shape({
    fromValue: Yup.string()
      .required("Value is required")
      .test("insufficient-balance", "Insufficient balance", function (value) {
        return !value || Number(value) <= Number(formBalanceState);
      }),
    toValue: Yup.string().required("Value is required"),
  });
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

  const fromTokenList = useMemo(() => {
    return [WQIE_TOKEN, QIE_TOKEN];
  }, [tokenListData, formik?.values?.fromCurrency, formik?.values?.toCurrency]);
  const {
    balance: fromBalance,
    error,
    refetch: refecthFromBalance,
    loading: fromBalanceLoading,
  } = useTokenBalance({
    tokenAddress: formik?.values?.fromCurrency?.address,
    userAddress: address,
    chainId: formik?.values?.fromCurrency?.chainId,
    rpcUrl: QIE_BLOCKCHAIN_CONFIG?.rpc,
  });
  useEffect(() => {
    setFormBalanceState(fromBalance);
  }, [fromBalance]);

  const { balance: toBalance, refetch: refecthToBalance } = useTokenBalance({
    tokenAddress: formik?.values?.toCurrency?.address,
    userAddress: address,
    chainId: formik?.values?.toCurrency?.chainId,
    rpcUrl: QIE_BLOCKCHAIN_CONFIG?.rpc,
  });
  const submissionHandler = async () => {
    try {
      if (formik?.values?.fromCurrency?.symbol == "QIE") {
        nativeExecutionHanlder();
      } else {
        wrappedExecutionHanlder();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const nativeExecutionHanlder = async () => {
    try {
      const convertedValue = parseUnits(formik?.values?.fromValue);

      const result = await writeContractAsync({
        abi: WQIAbi,
        functionName: "deposit",
        address: WQIE_address,
        value: convertedValue,
      });
      const transactionReceipt = await waitForTransactionReceipt(config, {
        hash: result,
      });
      setCurrentTx(transactionReceipt?.transactionHash);
      refecthFromBalance();
      refecthToBalance();
      toast.success("Transaction successful");
    } catch (error) {
      toast.error(error?.shortMessage || "Transaction Failed");
      console.log(error);
    }
  };
  const wrappedExecutionHanlder = async () => {
    try {
      const convertedValue = parseUnits(formik?.values?.toValue);

      const result = await writeContractAsync({
        abi: WQIAbi,
        functionName: "withdraw",
        address: WQIE_address,
        args: [convertedValue],
      });
      const transactionReceipt = await waitForTransactionReceipt(config, {
        hash: result,
      });
      setCurrentTx(transactionReceipt?.transactionHash);
      refecthFromBalance();
      refecthToBalance();
      toast.success("Transaction successful");
    } catch (error) {
      toast.error(error?.shortMessage || "Transaction Failed");
      console.log(error);
    }
  };

  const buttonState = useMemo(() => {
    if (!formik?.values?.fromCurrency?.symbol) {
      return {
        isValid: false,
        text: "Select Currency",
      };
    }
    if (writeContractPending) {
      return {
        isValid: false,
        text: "Executing..",
      };
    }
    if (fromBalanceLoading) {
      return {
        isValid: false,
        text: "Getting Balance..",
      };
    }
    if (!fromBalance || fromBalance == 0) {
      return {
        isValid: false,
        text: "Insufficient Balance",
      };
    }
    return {
      isValid: true,
      text: "Execute",
    };
  }, [
    writeContractPending,
    fromBalance,
    fromBalanceLoading,
    formik?.values?.fromCurrency,
  ]);

  return (
    <div className="flex items-center justify-center flex-col bg-muted/20 mt-10 w-full md:w-[600px] min-h-[500px] rounded-2xl backdrop-blur-3xl ring ring-[#ff136d] py-10 relative">
      <div className="w-full flex justify-center     items-center px-12">
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
                formik.handleChange(e);
                const val = e?.target?.value;
                formik.setFieldValue("toValue", val);
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
            <div className="absolute border h-[80%] w-32 md:w-36 flex justify-start items-center ml-2 rounded-md cursor-pointer ring ring-ring/10 px-3">
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
              {/* <p className="text-xs">
                {toBalance} {formik?.values?.toCurrency?.symbol}
              </p> */}
              <button className="text-xs">Max</button>
            </div>
          </div>
        </div>
        {currentTx && (
          <div className="w-full my-10 flex flex-row justify-between">
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
          {buttonState?.text}
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
            if (val?.symbol == "WQIE") {
              formik.setFieldValue("toCurrency", QIE_TOKEN);
            } else {
              formik.setFieldValue("toCurrency", WQIE_TOKEN);
            }
          }}
          tokenList={fromTokenList}
        />
      )}
    </div>
  );
};

export default NativeSwap;
