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
import { IconX } from "@tabler/icons-react";

export function TokenSelector({ openModal, setOpenModal }) {
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
            <Input placeholder="Search token" className={"w-full"} />
            <div className="w-full flex flex-col gap-2">
              {Array(10)
                ?.fill("i")
                ?.map((item, idx) => {
                  return (
                    <div key={idx} className="w-full  py-2">
                      <p className="text-xs" key={idx}>
                        BTC
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
