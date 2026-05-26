import { Metadata } from "next";
import { App } from "../page";

export const metadata: Metadata = {
  title: "Our Vision & Core Philosophy - Premium SaaS Tools Hub",
  description: "Learn about the metered freemium monetization model, total privacy features, and secure digital bouncer serverless architecture.",
};

export default function AboutPage() {
  return <App initialSlug="about" />;
}
