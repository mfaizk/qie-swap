import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconArrowsDownUp } from "@tabler/icons-react";
import { Button } from "@/components/ui/stateful-button";
import { TokenSelector } from "./token-selector";
const Liquidity = () => {
  const [openModal, setOpenModal] = useState(false);
  return (
    <div className="w-full flex items-center justify-center flex-col">
      <h2>Add Liquidity</h2>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex gap-2 flex-col">
          <div className="mt-20 relative flex items-center">
            <div
              className="absolute border h-[80%] w-48 flex justify-center items-center ml-2 rounded-md cursor-pointer"
              onClick={() => {
                setOpenModal(true);
              }}
            >
              <p className="text-sm">Select a currency</p>
            </div>
            <Input
              type="text"
              placeholder="0.00"
              className={"h-14 w-lg pl-52"}
            />
          </div>
          <div className="px-2 flex justify-between items-center">
            <p className="text-xs text-red-500"> Erro</p>
            <button className="text-xs">Max</button>
          </div>
        </div>
        <IconArrowsDownUp />
        <div className="flex gap-2 flex-col mt-4">
          <div className=" relative flex items-center">
            <div
              className="absolute border h-[80%] w-48 flex justify-center items-center ml-2 rounded-md cursor-pointer"
              onClick={() => {
                setOpenModal(true);
              }}
            >
              <p className="text-sm">Select a currency</p>
            </div>
            <Input
              type="text"
              placeholder="0.00"
              className={"h-14 w-lg pl-52"}
            />
          </div>
          <div className="px-2 flex justify-between items-center">
            <p className="text-xs text-red-500"> Erro</p>
            <button className="text-xs">Max</button>
          </div>
        </div>

        <Button
          className={
            "text-xl border w-full rounded h-14 cursor-pointer bg-transparent"
          }
          //   onClick={handleClick}
        >
          Send message
        </Button>
      </div>
      <TokenSelector openModal={openModal} setOpenModal={setOpenModal} />
    </div>
  );
};

export default Liquidity;
