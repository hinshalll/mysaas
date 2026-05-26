import { Metadata } from "next";
import { App } from "../page";

export const metadata: Metadata = {
  title: "Changelog & Product Updates - Premium SaaS Tools Hub",
  description: "Track our software releases, features, integrations, and daily engineering updates for our utilities suite.",
};

export default function ChangelogRoute() {
  return <App initialSlug="changelog" />;
}
