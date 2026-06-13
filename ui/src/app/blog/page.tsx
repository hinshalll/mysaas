import { Metadata } from "next";
import BlogClient from "./BlogClient";

export const metadata: Metadata = {
  title: "Blog - MySaaS Tools Hub",
  description: "Behind-the-scenes engineering, product decisions, and the thinking that shapes our on-device utility tools.",
};

export default function BlogPageRoute() {
  return <BlogClient />;
}

