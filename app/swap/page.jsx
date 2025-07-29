"use client";

import { Tabs } from "@/components/ui/tabs";
import { MagicCard } from "@/components/magicui/magic-card";
import SwapComponent from "@/common-component/swap/swap";
import Liquidity from "@/common-component/swap/liquidity";

const Swap = () => {
  return (
    <div className="h-[20rem] md:h-[40rem] [perspective:1000px] relative b flex flex-col max-w-5xl mx-auto w-full  items-start justify-start my-40">
      <Tabs tabs={tabs} />
    </div>
  );
};

export default Swap;

const tabs = [
  {
    title: "Swap",
    value: "swap",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-purple-700 to-violet-900">
        <SwapComponent />
      </div>
    ),
  },
  {
    title: "Add liquidity",
    value: "add-liquidity",
    content: (
      <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-purple-700 to-violet-900">
        <Liquidity />
      </div>
    ),
  },
];
