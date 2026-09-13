import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swami Super Market — Grocery Store in Usasa, Ballia",
  description:
    "Swami Super Market (स्वामी सुपर मार्केट) in Usasa, Ballia, UP. Shop daily essentials, flour, rice, pulses, spices, oils, and home products with easy WhatsApp ordering.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-neutral-50 text-neutral-900"
      >
        {children}
      </body>
    </html>
  );
}
