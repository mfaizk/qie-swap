import { cookieStorage, createStorage, http } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, arbitrum, defineChain } from "@reown/appkit/networks";

export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || "38f6cbdcf2b580899317454c1ff8a4d4";

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const appConfigurations = [
  {
    rpc: "https://rpc1mainnet.qie.digital",
    caipNetworkId: "eip155:1990",
    chainNamespace: "eip155",
    explorerName: "QIE Mainnet",
    explorerUrl: "https://mainnet.qie.digital",
    chainId: 1990,
    chainName: "QIE Mainnet",

    nativeCurrency: {
      decimals: 18,
      name: "QIE",
      symbol: "QIE",
    },
    multicall3Address: "0x7E055DfaF148023A7B273e1F71014Caf34598b3D",
  },
];

export const ChainConfig = appConfigurations.map((config) =>
  defineChain({
    id: config.chainId,
    caipNetworkId: config.caipNetworkId,
    chainNamespace: "eip155",
    name: config.chainName,

    nativeCurrency: config.nativeCurrency,
    rpcUrls: {
      default: {
        http: [config.rpc],
      },
      public: {
        http: [config.rpc],
      },
    },
    blockExplorers: {
      default: { name: config.explorerName, url: config.explorerUrl },
    },
    contracts: {
      multicall3: {
        address: config.multicall3Address,
      },
    },
  })
);

export const QIDEX_Factory_address =
  "0xba33504bD33eF3731Cf8f59F755b289abb88F177";
export const WQIE_address = "0x0087904D95BEe9E5F24dc8852804b547981A9139";
export const QIEDEXRouter_address =
  "0x807667fe19f1D8Ee2265b2Ce2341130AF423cBD2";
export const INIT_CODE =
  "0xa4338cf2371c14c49fa8b5e1b8fcb50ed7a9bd026afb72bf9f3f45186cf54315";

export const token = [
  {
    name: "QIE",
    symbol: "QIE",
    icon: "/assets/logo.png",
  },

  {
    name: "X-MAD",
    symbol: "XM",
    address: "0x93626A78e74b3BE70Dc649ef052A70618F1A540f",
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTx3pGHmlrLn7g_qR-W0JcSr-qTYsCBw4C2Sw&s",
  },
];

export const networks = [mainnet, arbitrum];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks: [...ChainConfig],
});

export const config = wagmiAdapter.wagmiConfig;

export const QIE_TOKEN = {
  chainId: 1990,
  name: "QIE",
  symbol: "QIE",
  decimals: 18,
  logoURI: "/assets/logo.png",
};
export const WQIE_TOKEN = {
  chainId: 1990,
  name: "WQIE",
  symbol: "WQIE",
  decimals: 18,
  logoURI: "/assets/logo.png",
  address: WQIE_address,
};
