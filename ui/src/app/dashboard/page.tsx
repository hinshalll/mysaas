import { Metadata } from "next";
import { App } from "../page";

export const metadata: Metadata = {
  title: "Dashboard & Workspace - Premium SaaS Tools Hub",
  description: "Access all formatted data, conversion, text-processing, and file-parsing utilities in one keyboard-driven workspace.",
};

export default function DashboardRoute() {
  return <App initialSlug="dashboard" />;
}
