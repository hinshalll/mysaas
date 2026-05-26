import { Metadata } from "next";
import { App } from "../../page";
import { ALL_TOOLS } from "../../config";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// Generate dynamic SEO metadata dynamically tailored for Google Search
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  const matchedTool = ALL_TOOLS.find(t => t.id === slug);
  const toolName = matchedTool ? matchedTool.name : "Premium SaaS Utility";
  const tagline = matchedTool ? matchedTool.tagline : "Lightweight online developer and creator tool.";
  
  return {
    title: `${toolName} - Premium Online Utility Tool`,
    description: `${tagline}. Safe, browser-local data processing, no account required.`,
  };
}

export default async function DynamicToolStubPage({ params }: Props) {
  const { slug } = await params;
  
  return <App initialSlug={slug} />;
}
