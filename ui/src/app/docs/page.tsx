import { Metadata } from "next";
import { App } from "../page";

export const metadata: Metadata = {
  title: "Developer Documentation & Technical Guide - Premium SaaS Tools Hub",
  description: "Check the API endpoints, rate limits guidelines, and security compliance records for our tools catalog.",
};

export default function DocsPage() {
  return <App initialSlug="docs" />;
}
