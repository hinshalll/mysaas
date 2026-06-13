import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./global_theme.css";
import { SaaSProvider } from "../context/SaaSContext";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import GlobalModals from "../components/GlobalModals";
import StructuredData from "../components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Premium SaaS Tools Hub - All-in-One Utility Workspace",
    template: "%s | Premium SaaS Tools Hub"
  },
  description: "An all-in-one developer and professional utility workspace featuring AI formatting tools, JSON validation, media conversion, and secure cloud workflows.",
  metadataBase: new URL("https://mysaas.com"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Premium SaaS Tools Hub - All-in-One Utility Workspace",
    description: "An all-in-one developer and professional utility workspace featuring AI formatting tools, JSON validation, media conversion, and secure cloud workflows.",
    type: "website",
    siteName: "MySaaS Hub",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SaaSProvider>
          <StructuredData />
          <TopBar />
          <main className="flex-grow relative z-10">{children}</main>
          <Footer />
          <GlobalModals />
        </SaaSProvider>
      </body>
    </html>
  );
}
