import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  title: "Cookbook - Your Recipe & Meal Planner",
  description: "A delightful app for managing recipes and planning meals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 min-h-screen`}
        >
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "font-sans",
              style: {
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "16px",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
