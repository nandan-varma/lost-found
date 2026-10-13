import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSiteUrl } from "@/lib/site";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  applicationName: "Lost and Found",
  description:
    "Find what's lost. Return what's found. A simple way for your organization to track lost and found items.",
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    description:
      "Find what's lost. Return what's found. A simple way for your organization to track lost and found items.",
    siteName: "Lost and Found",
    title: "Lost and Found",
    type: "website",
    url: "/",
  },
  title: {
    default: "Lost and Found",
    template: "%s | Lost and Found",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "Find what's lost. Return what's found. A simple way for your organization to track lost and found items.",
    title: "Lost and Found",
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
