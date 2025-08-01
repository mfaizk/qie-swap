import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { token, WQIE_address } from "@/config/blockchain";
import { useTokenList } from "@/service/queries";
import { IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useConfig, useReadContracts } from "wagmi";

export function TokenSelector({
  openModal,
  setOpenModal,
  onChange,
  currentToken,
  toToken,
  type,
  fromType,
}) {
  const [searchToken, setSearchToken] = useState("");
  const config = useConfig();
  const { data: tokenListData, isLoading: tokenListLoading } = useTokenList();

  const tokenList = useMemo(() => {
    if (currentToken?.address || toToken?.address) {
      return tokenListData?.filter((item) => {
        if (
          item?.address == currentToken?.address ||
          item?.address == toToken?.address
        ) {
          return false;
        }
        return true;
      });
    }

    return tokenListData;
  }, [tokenListData, currentToken, toToken, type, fromType]);

  return (
    <AlertDialog open={openModal} onOpenChange={(val) => setOpenModal(val)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <div className="flex justify-between items-center">
              Select Token
              <IconX
                className="text-gray-500 cursor-pointer"
                onClick={() => {
                  setOpenModal(false);
                }}
              />
            </div>
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter className={"flex flex-col"}>
          <div className="flex flex-col items-center justify-center w-full gap-10">
            <div className="w-full flex flex-col gap-2 max-h-96 overflow-auto">
              {tokenList?.map((item, idx) => {
                return (
                  <div
                    key={idx}
                    className="w-full  py-2 flex gap-2 items-center cursor-pointer"
                    onClick={() => {
                      if (onChange) {
                        onChange(item);
                      }
                    }}
                  >
                    <img
                      src={item?.logoURI}
                      className="object-contain h-4 w-4"
                    />
                    <p className="text-md" key={idx}>
                      {item?.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          {/* <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction> */}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
