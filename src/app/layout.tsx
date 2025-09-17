import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TanStackProvider from "@/provider/tanstack";
import ThemeProvider from "@/provider/theme";
import ReduxProvider from "@/provider/redux";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <ThemeProvider>
            <TanStackProvider>
              <AppShell>{children}</AppShell>
            </TanStackProvider>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
