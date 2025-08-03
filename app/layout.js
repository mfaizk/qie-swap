import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BlockChainProvider from "@/providers/blockchain-provider";
import { headers } from "next/headers";
import { CustomNavbar } from "@/common-component/globals/navbar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "QIE Swap",
  description: "Next gen blockchain Swap",
  icons: {
    icon: ["/assets/logo.png"],
    apple: ["/assets/logo.png"],
    shortcut: ["/assets/logo.png"],
  },
  other: {
    rel: "mask-icon",
    url: "/assets/logo.png",
  },
};

export default async function RootLayout({ children }) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <CustomNavbar>
          <BlockChainProvider cookies={cookies}>{children}</BlockChainProvider>
        </CustomNavbar>
        <Toaster />
      </body>
    </html>
  );
}
