import { Metadata } from 'next';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
  title: "Premium SaaS Tools Hub - All-in-One Utility Workspace",
  description: "An all-in-one developer and professional utility workspace featuring AI formatting tools, JSON validation, media conversion, and secure cloud workflows. Run tools entirely on-device with zero server storage.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <LandingClient />;
}
