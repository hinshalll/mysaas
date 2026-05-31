import { Metadata } from "next";
import { App } from "../page";

export const metadata: Metadata = {
  title: "Our Vision & Core Philosophy - Premium SaaS Tools Hub",
  description: "Learn about our vision, secure cloud architecture, privacy-first design, and transparent pricing behind our high-performance utility tools.",
};

export default function AboutPage() {
  return <App initialSlug="about" />;
}
