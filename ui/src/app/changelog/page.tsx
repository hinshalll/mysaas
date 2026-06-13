import { Metadata } from "next";
import ChangelogClient from "./ChangelogClient";

export const metadata: Metadata = {
  title: "Changelog & Product Updates - Premium SaaS Tools Hub",
  description: "Track our software releases, features, integrations, and daily engineering updates for our utilities suite.",
};

export default function ChangelogRoute() {
  return <ChangelogClient />;
}

