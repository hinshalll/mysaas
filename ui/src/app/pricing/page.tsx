import { Metadata } from "next";
import { App } from "../page";

export const metadata: Metadata = {
  title: "Simple & Fair Pricing - Premium SaaS Tools Hub",
  description: "Explore our flexible Metered Freemium pricing, domestic PPP options, and Pro Workspace bulk execution plans.",
};

export default function PricingPage() {
  return <App initialSlug="pricing" />;
}
