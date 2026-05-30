import { Metadata } from "next";
import { App } from "../../page";
import { ALL_TOOLS } from "../../config";

export async function generateMetadata(): Promise<Metadata> {
  const matchedTool = ALL_TOOLS.find(t => t.id === "json");
  const toolName = matchedTool ? matchedTool.name : "JSON Formatter & Validator";
  const tagline = matchedTool ? matchedTool.tagline : "Lightweight online developer and creator tool.";
  
  return {
    title: `${toolName} - Premium Online Utility Tool`,
    description: `${tagline}. Safe, browser-local data processing, no account required.`,
  };
}

export default async function Page() {
  return <App initialSlug="json" />;
}
