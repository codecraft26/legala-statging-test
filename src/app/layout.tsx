import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TanStackProvider from "@/provider/tanstack";
import ThemeProvider from "@/provider/theme";
import AppShell from "@/components/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Infrahive Legal",
  description: "Infrahive Legal Platform",
  icons: {
    icon: [
      { url: "/logo.png", rel: "icon" },
      { url: "/logo.png", rel: "shortcut icon" },
    ],
    apple: [
      { url: "/logo.png", rel: "apple-touch-icon" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <TanStackProvider>
            <AppShell>{children}</AppShell>
          </TanStackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
