import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { IconArrowsDownUp } from "@tabler/icons-react";
import { Button } from "@/components/ui/stateful-button";
import { TokenSelector } from "./token-selector";
import { useFormik } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  fromValue: Yup.string().required("From value is required"),
  toValue: Yup.string().required("To value is required"),
});
const Liquidity = () => {
  const [openModal, setOpenModal] = useState(false);
  const formik = useFormik({
    initialValues: {
      fromValue: "",
      toValue: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      alert(JSON.stringify(values, null, 2));
    },
  });
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
                setOpenModal(true);
              }}
            >
              <p className="text-xs md:text-sm">Select a currency</p>
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
            <button className="text-xs">Max</button>
          </div>
        </div>
        <IconArrowsDownUp />
        <div className="flex gap-2 flex-col w-full">
          <div className="mt-6 relative flex items-center w-full ">
            <div
              className="absolute border h-[80%] w-32 md:w-36 flex justify-start items-center ml-2 rounded-md cursor-pointer ring ring-ring/10 px-3"
              onClick={() => {
                setOpenModal(true);
              }}
            >
              <p className="text-xs md:text-sm">Select a currency</p>
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
            <button className="text-xs">Max</button>
          </div>
        </div>

        <Button
          className={
            "text-xl border w-full rounded h-14 cursor-pointer bg-transparent"
          }
          onClick={() => {
            // handleClick
            formik.handleSubmit();
          }}
        >
          Exexute
        </Button>
      </div>
      <TokenSelector openModal={openModal} setOpenModal={setOpenModal} />
    </div>
  );
};

export default Liquidity;
