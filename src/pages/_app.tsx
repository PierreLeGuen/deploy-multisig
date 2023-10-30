import { WalletSelectorContextProvider } from "@/contexts/WalletSelectorContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

import "@near-wallet-selector/modal-ui/styles.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletSelectorContextProvider>
      <Component {...pageProps} />
    </WalletSelectorContextProvider>
  );
}
