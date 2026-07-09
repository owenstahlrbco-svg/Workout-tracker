import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Pitch HQ Dashboard",
  description: "Your training headquarters — plans, workouts, progress, and a direct line to your coach.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pitch HQ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#022c22",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full bg-[#f5f8f5] text-emerald-950 antialiased font-sans">{children}</body>
    </html>
  );
}
