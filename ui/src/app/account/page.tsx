import { Metadata } from "next";
import { App } from "../page";

export const metadata: Metadata = {
  title: "Account Settings & Preferences - Premium SaaS Tools Hub",
  description: "Customize your editor width mode, strip PDF watermark headers/footers, choose interface theme contrast, and manage your billing settings.",
};

export default function AccountPageRoute() {
  return <App initialSlug="account" />;
}
