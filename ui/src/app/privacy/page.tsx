import { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy - MySaaS Tools Hub",
  description: "Learn how MySaaS protects your data with on-device processing, zero-logging server pipelines, and minimal data collection.",
};

export default function PrivacyPageRoute() {
  return <PrivacyClient />;
}

