"use client";

import SwapComponent from "@/common-component/swap/swap";
import Liquidity from "@/common-component/swap/liquidity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Swap = () => {
  return (
    <div className="container mx-auto  mt-20 justify-center items-center">
      <div className="flex w-full items-center justify-center flex-col gap-6 ">
        <Tabs
          defaultValue="swap"
          className={"w-full md:w-[600px] flex items-center justify-center"}
        >
          <TabsList className={" w-full"}>
            <TabsTrigger value="swap">Swap</TabsTrigger>
            <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          </TabsList>
          <TabsContent value="swap" className={"w-full"}>
            <SwapComponent />
          </TabsContent>
          <TabsContent value="liquidity" className={"w-full"}>
            <Liquidity />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Swap;

//  <SwapComponent />
//           <Liquidity />
