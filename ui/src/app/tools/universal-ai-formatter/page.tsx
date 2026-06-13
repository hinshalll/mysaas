import { Metadata } from "next";
import UniversalAIFormatterClient from "./UniversalAIFormatterClient";
import { ALL_TOOLS } from "../../config";

export async function generateMetadata(): Promise<Metadata> {
  const matchedTool = ALL_TOOLS.find(t => t.id === "universal-ai-formatter");
  const toolName = matchedTool ? matchedTool.name : "Universal AI Formatter";
  const tagline = matchedTool ? matchedTool.tagline : "Lightweight online developer and creator tool.";
  
  return {
    title: `${toolName} - Premium Online Utility Tool`,
    description: `${tagline}. Safe, browser-local data processing, no account required.`,
  };
}

export default async function Page() {
  return <UniversalAIFormatterClient />;
}

