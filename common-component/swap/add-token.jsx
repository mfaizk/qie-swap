import { Input } from "@/components/ui/input";
import React, { useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/stateful-button";
import { useTokenDetails } from "@/hooks/useTokenDetails";
import { useEthersProvider } from "@/hooks/useEthersProvider";
import { erc20Abi } from "viem";
import { ethers } from "ethers";
import { uploadTokenLogo } from "@/service/queries";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "@/providers/blockchain-provider";

const validationSchema = Yup.object().shape({
  address: Yup.string().required("From value is required"),
});
const AddToken = () => {
  const provider = useEthersProvider();
  const [gettingTokenData, setGettingTokenData] = useState(false);
  const [file, setFile] = useState();
  const fileInputRef = useRef(null);

  const [currentTokenData, setCurrentTokenData] = useState({
    name: "",
    symbol: "",
    decimals: "",
  });
  const formik = useFormik({
    initialValues: {
      address: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      if (
        !currentTokenData?.decimals ||
        !currentTokenData?.name ||
        !currentTokenData?.symbol ||
        !file
      ) {
        toast.error("All fields are required.");
      }
      addToken();
    },
  });
  const {
    mutateAsync: addToken,
    isPending: addTokenPending,
    error,
  } = useMutation({
    mutationFn: () => {
      return uploadTokenLogo({
        decimals: currentTokenData?.decimals,
        file: file,
        name: currentTokenData?.name,
        symbol: currentTokenData?.symbol,
        tokenAddress: formik?.values?.address,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
      if (data?.success) {
        toast.success("Token added.");
        formik?.resetForm();
        setCurrentTokenData({
          name: "",
          symbol: "",
          decimals: "",
        });
        setFile();
        fileInputRef.current.value = null;
      } else {
        toast.error("Unable to add token");
      }
    },
  });
  async function fetchTokenDetails() {
    try {
      setGettingTokenData(true);
      const tokenContract = new ethers.Contract(
        formik?.values?.address,
        erc20Abi,
        provider
      );
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);

      setCurrentTokenData({
        name,
        symbol,
        decimals,
      });
      setGettingTokenData(false);
    } catch (error) {
      toast.error("Failed to fetch token details");
      console.error("Failed to fetch token details:", error);
      setGettingTokenData(false);
    }
  }

  return (
    <div className="flex items-center justify-center flex-col bg-muted/20 mt-10 w-full md:w-[600px] min-h-[500px] rounded-2xl backdrop-blur-3xl ring ring-[#ff136d]">
      <div className=" w-full items-center justify-center flex">
        <h2 className="text-2xl font-semibold">Add Token</h2>
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex gap-2 flex-col w-full">
          <div className="mt-20 relative flex items-center w-full ">
            <Input
              type="text"
              name="address"
              onChange={formik.handleChange}
              value={formik.values.address}
              placeholder="0x"
              className={"h-14 w-full md:w-lg "}
            />
            <button
              onClick={() => {
                fetchTokenDetails();
              }}
              className="absolute right-2 bg-brand h-[60%] w-24 rounded"
              disabled={gettingTokenData}
            >
              {gettingTokenData ? `Checking..` : `Check`}
            </button>
          </div>
          <div className="px-2 flex justify-between items-center">
            <p className="text-xs text-red-500"> {formik?.errors?.address}</p>
          </div>
        </div>
        {currentTokenData?.name && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex justify-between w-full">
              <p>Token Name:</p>
              <p>{currentTokenData?.name}</p>
            </div>
            <div className="flex justify-between w-full">
              <p>Token Symbol:</p>
              <p>{currentTokenData?.symbol}</p>
            </div>
            <div className="flex justify-between w-full">
              <p>Token Decimal:</p>
              <p>{currentTokenData?.decimals}</p>
            </div>
          </div>
        )}

        {currentTokenData?.name && (
          <>
            <div className="flex gap-2 flex-col w-full">
              <div className="mt-4 relative flex items-center w-full ">
                <input
                  type="file"
                  name="icon"
                  ref={fileInputRef}
                  onChange={(e) => {
                    console.log(e.target.files[0], "asdasdsd");

                    setFile(e.target.files[0]);
                  }}
                  placeholder="0x"
                  className={"h-14 w-full md:w-lg "}
                />
              </div>
              <div className="px-2 flex justify-between items-center">
                {/* <p className="text-xs text-red-500"> {formik?.errors?.icon}</p> */}
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
              {addTokenPending ? `Executing...` : `Exexute`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AddToken;
