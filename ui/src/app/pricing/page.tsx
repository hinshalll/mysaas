import { Metadata } from "next";
import { App } from "../page";

export const metadata: Metadata = {
  title: "Simple & Fair Pricing - Premium SaaS Tools Hub",
  description: "Simple, transparent pricing. Choose from our Free Plan, Pro Plan, or Developer Plan. Unlock unlimited execution, developer API keys, and custom branding.",
};

export default function PricingPage() {
  return <App initialSlug="pricing" />;
}
