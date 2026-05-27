import type { Metadata } from "next";
import { Caprasimo, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";

const caprasimo = Caprasimo({
  weight: "400",
  variable: "--font-caprasimo",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  weight: ["500", "600", "700"],
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BakedByIsh — small-batch cookies, baked with love",
  description:
    "Hand-rolled, brown-buttered, slightly under-baked on purpose. Made in small batches every week and delivered warm-ish across town.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${caprasimo.variable} ${jakarta.variable} ${caveat.variable}`}
    >
      <body>
        <div id="root-content">{children}</div>
      </body>
    </html>
  );
}
