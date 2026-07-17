import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSiteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Lost and Found",
    template: "%s | Lost and Found",
  },
  description:
    "Find what's lost. Return what's found. A simple way for your organization to track lost and found items.",
  applicationName: "Lost and Found",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Lost and Found",
    title: "Lost and Found",
    description:
      "Find what's lost. Return what's found. A simple way for your organization to track lost and found items.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lost and Found",
    description:
      "Find what's lost. Return what's found. A simple way for your organization to track lost and found items.",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <TooltipProvider>
            <Providers>{children}</Providers>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
