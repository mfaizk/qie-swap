import { Input } from "@/components/ui/input";
import React, { useMemo, useState } from "react";
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

const validationSchema = Yup.object().shape({
  fromValue: Yup.string().required("From value is required"),
  toValue: Yup.string().required("To value is required"),
});
const Liquidity = () => {
  const [openModalFrom, setOpenModalFrom] = useState(false);
  const [openModalTo, setOpenModalTo] = useState(false);
  const { data: tokenListData, isLoading: tokenListLoading } = useTokenList();

  const { address } = useAccount();
  const signer = useEthersSigner();
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
          slippage: 1,
          tokenA: formik?.values?.fromCurrency,
          tokenB: formik?.values?.toCurrency,
        });
        console.log(hash, "asdasdasd");
      }
    } catch (error) {
      console.log(error, "error in add liquidity");
    }
  };

  // const fromTokenList = useMemo(() => {}, [formik?.values]);
  // const toTokenList = useMemo(() => {}, []);

  return (
    <div className="flex items-center justify-center flex-col bg-muted/20 mt-10 w-full md:w-[600px] h-[500px] rounded-2xl backdrop-blur-3xl ring ring-[#ff136d]">
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

        <Button
          className={
            "text-xl border w-full rounded h-14 cursor-pointer bg-transparent"
          }
          onClick={() => {
            formik.handleSubmit();
          }}
        >
          Exexute
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

export default Liquidity;
