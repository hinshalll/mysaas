import { Metadata } from "next";
import { App } from "../page";

export const metadata: Metadata = {
  title: "Blog - MySaaS Tools Hub",
  description: "Behind-the-scenes engineering, product decisions, and the thinking that shapes our on-device utility tools.",
};

export default function BlogPage() {
  return <App initialSlug="blog" />;
}
