import { Metadata } from "next";
import RoadmapClient from "./RoadmapClient";

export const metadata: Metadata = {
  title: "Product Roadmap - MySaaS Tools Hub",
  description: "See what we're building next. Our quarterly roadmap of upcoming tools, features, and platform improvements.",
};

export default function RoadmapPageRoute() {
  return <RoadmapClient />;
}

