import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { abcRepro, abcReproMono } from './fonts/fonts';
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NorskPrøven",
  description: "NorskPrøven er en KI agent som hjelper deg med å lære norsk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${abcReproMono.variable} ${abcRepro.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
