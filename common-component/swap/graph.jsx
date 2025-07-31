import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IconX } from "@tabler/icons-react";

export function GraphModal({ openModal, setOpenModal }) {
  return (
    <AlertDialog open={openModal} onOpenChange={(val) => setOpenModal(val)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <div className="flex justify-between items-center">
              Graph
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
            <div className="w-full flex flex-col gap-2 h-96 overflow-auto"></div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
