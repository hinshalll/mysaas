import { Metadata } from "next";
import { App } from "../../../page";
import { AI_SOURCES, FORMATS } from "../../../config";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// Generate dynamic SEO metadata dynamically tailored for Google Search
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  const parts = slug.split("-to-");
  let aiLabel = "AI";
  let fmtLabel = "Document";
  
  if (parts.length === 2) {
    const src = parts[0];
    const fmt = parts[1];
    
    const matchedAi = AI_SOURCES.find(a => a.value === src);
    const matchedFmt = FORMATS.find(f => f.value === fmt);
    
    if (matchedAi) aiLabel = matchedAi.label.replace(" Style", "");
    if (matchedFmt) fmtLabel = matchedFmt.label;
  }
  
  return {
    title: `Convert ${aiLabel} Chats to ${fmtLabel} Online - Free & Clean`,
    description: `Instantly convert and format raw ${aiLabel} outputs into professional styled ${fmtLabel} files. Free, on-device rendering, no account required.`,
  };
}

export default async function DynamicToolPage({ params }: Props) {
  const { slug } = await params;
  
  return <App initialSlug={slug} />;
}
