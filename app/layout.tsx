import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SoraFont = Sora({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Decentralized Lending with AI-Personalized Intelligence | Built on IOTA Rebased",
  description:
    "A decentralized money market protocol on IOTA Rebased with AI-powered real-time alerts for smarter loan and collateral management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={SoraFont.className}>
        <Providers>
          {/* Content */}
          <div
            className={`relative z-20 container  mx-auto px-4 py-6 min-h-screen flex flex-col`}
          >
            <Header />
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
