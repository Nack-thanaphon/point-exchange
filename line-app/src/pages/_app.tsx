import "@/styles/globals.css";
import type { AppProps } from "next/app";
import * as dotenv from "dotenv";
dotenv.config();

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
