import { Metadata } from "next";
import { App } from "../../page";
import { ALL_TOOLS } from "../../config";

interface Props {
  params: Promise<{}>;
}

export async function generateMetadata(): Promise<Metadata> {
  const matchedTool = ALL_TOOLS.find(t => t.id === "base64-encoder-decoder");
  const toolName = matchedTool ? matchedTool.name : "Premium SaaS Utility";
  const tagline = matchedTool ? matchedTool.tagline : "Lightweight online developer and creator tool.";
  
  return {
    title: `${toolName} - Premium Online Utility Tool`,
    description: `${tagline}. Safe, browser-local data processing, no account required.`,
  };
}

export default async function Page() {
  return <App initialSlug="base64-encoder-decoder" />;
}
