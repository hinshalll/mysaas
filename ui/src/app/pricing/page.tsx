import { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: "Simple & Fair Pricing",
  description: "Simple, transparent pricing. Choose from our Free Plan, Pro Plan, or Developer Plan. Unlock unlimited execution, developer API keys, and custom branding.",
};

export default function PricingPage() {
  return <PricingClient />;
}
