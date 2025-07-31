import { useQuery } from "@tanstack/react-query";

const { api, post } = require("./apiService");

export const uploadTokenLogo = async ({
  file,
  tokenAddress,
  name,
  symbol,
  decimals,
}) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tokenAddress", tokenAddress);
  formData.append("name", name);
  formData.append("symbol", symbol);
  formData.append("decimals", decimals.toString());

  const response = await api({
    method: "POST",
    url: "/upload-logo",
    data: formData,
  });

  return response.data;
};

export const useTokenList = () => {
  return useQuery({
    queryKey: ["tokens"],
    select: (data) => {
      console.log(data, "asdasdasda");
      if (data?.status == 200) {
        return data?.data?.tokens;
      } else {
        return [];
      }
    },
    queryFn: () => {
      return api({
        url: "/tokenlist",
        method: "GET",
      });
    },
  });
};
