import { Metadata } from "next";
import { App } from "../page";

export const metadata: Metadata = {
  title: "Developer API Keys & Dashboard - Premium SaaS Tools Hub",
  description: "Generate production API keys, test endpoints with sandbox keys, check analytics, and integrate formatters programmatically.",
};

export default function DeveloperPage() {
  return <App initialSlug="developer" />;
}
