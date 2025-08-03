import { Input } from "@/components/ui/input";
import React, { useEffect, useMemo, useState } from "react";
import { IconArrowsDownUp } from "@tabler/icons-react";
import { Button } from "@/components/ui/stateful-button";
import { TokenSelector } from "./token-selector";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAccount } from "wagmi";
import { addLiquidityERC20Pair, useTokenList } from "@/service/queries";
import { useEthersSigner } from "@/hooks/useEthersSigner";
import { useEthersProvider } from "@/hooks/useEthersProvider";
import Slider, { Range } from "rc-slider";
import "rc-slider/assets/index.css";
import { toast } from "sonner";

const marks = {
  0.5: "0.5",
  1: "1",
};
const Liquidity = () => {
  const [openModalFrom, setOpenModalFrom] = useState(false);
  const [openModalTo, setOpenModalTo] = useState(false);
  const { data: tokenListData, isLoading: tokenListLoading } = useTokenList();
  const [isLoading, setIsLoading] = useState(false);

  const { address } = useAccount();
  const signer = useEthersSigner();
  const provider = useEthersProvider();
  const [fromBalanceState, setFromBalanceState] = useState();
  const [toBalanceState, setToBalanceState] = useState();

  const validationSchema = Yup.object().shape({
    fromValue: Yup.string()
      .required("Value is required")
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
    toValue: Yup.string()
      .required("To value is required")

      .test(
        "is-positive",
        "Amount must be greater than 0",
        (value) => Number(value) > 0
      )
      .test(
        "has-enough-balance",
        "Insufficient balance",
        (value) => Number(value) <= Number(toBalanceState)
      ),

    slippage: Yup.number()
      .required("Slippage is required")
      .min(0.5, "Slippage must be at least 0.5")
      .max(1, "Slippage cannot be more than 1"),
  });
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
      submissionHandler();
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
    rpcUrl: "https://rpc1mainnet.qie.digital",
  });

  useEffect(() => {
    setFromBalanceState(fromBalance);
  }, [fromBalance]);
  const { balance: toBalance, refetch: refetchToBalance } = useTokenBalance({
    tokenAddress: formik?.values?.toCurrency?.address,
    userAddress: address,
    chainId: formik?.values?.toCurrency?.chainId,
    rpcUrl: "https://rpc1mainnet.qie.digital",
  });
  useEffect(() => {
    setToBalanceState(toBalance);
  }, [toBalance]);
  const submissionHandler = async () => {
    try {
      setIsLoading(true);
      if (
        formik?.values?.fromCurrency?.address &&
        formik?.values?.toCurrency?.address
      ) {
        const hash = await addLiquidityERC20Pair({
          account: address,
          amountA: formik?.values?.fromValue,
          amountB: formik?.values?.toValue,
          provider: provider,
          signer: signer,
          slippage: formik?.values?.slippage,
          tokenA: formik?.values?.fromCurrency,
          tokenB: formik?.values?.toCurrency,
        });
      }
      await refetchFromBalance();
      await refetchToBalance();
      setIsLoading(false);
      toast.success("Transaction successful");
    } catch (error) {
      console.log(error, "error in add liquidity");
      toast.error(error?.shortMessage || "Transaction Failed");
      setIsLoading(false);
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
    <div className="flex items-center justify-center flex-col bg-muted/20 mt-10 px-8 w-[95%] sm sm:w-full md:w-[600px] min-h-[500px] rounded-2xl backdrop-blur-3xl ring ring-[#ff136d] py-10 relative ">
      <div className=" w-full items-center justify-center flex">
        <h2 className="text-2xl font-semibold">Add Liquidity</h2>
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
                    className="object-contain h-4 w-4"
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
              // onChange={formik.handleChange}
              onChange={(e) => {
                const item = e?.currentTarget?.value;
                const decimal = 8;
                const regex = new RegExp(`^(\\d*(\\.\\d{0,${decimal}})?)?$`);
                if (regex.test(item)) {
                  formik.handleChange(e);
                }
              }}
              value={formik.values.fromValue}
              placeholder="0.00"
              className={"h-14 w-full md:w-lg pl-36 md:pl-40"}
            />
          </div>
          <div className="px-2 flex justify-between items-center">
            <p className="text-xs text-red-500"> {formik?.errors?.fromValue}</p>
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
                    className="object-contain h-4 w-4"
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
              onChange={(e) => {
                const item = e?.currentTarget?.value;
                const decimal = 8;
                const regex = new RegExp(`^(\\d*(\\.\\d{0,${decimal}})?)?$`);
                if (regex.test(item)) {
                  formik.handleChange(e);
                }
              }}
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
        </div>

        <Button
          className={
            "text-xl border w-full rounded h-14 cursor-pointer bg-transparent"
          }
          onClick={() => {
            if (!isLoading) {
              formik.handleSubmit();
            }
          }}
        >
          {isLoading ? `Please Wait...` : `Add Liquidity`}
        </Button>
      </div>

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

export default Liquidity;
