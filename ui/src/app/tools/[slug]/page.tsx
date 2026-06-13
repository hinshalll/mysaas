import { Metadata } from "next";
import { redirect } from "next/navigation";
import DynamicToolClient from "./DynamicToolClient";
import { ALL_TOOLS } from "../../config";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// Generate dynamic SEO metadata dynamically tailored for Google Search
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  if (slug === 'uaf') {
    return {
      title: "Universal AI Formatter - Premium Online Utility Tool",
      description: "Raw AI output → premium themed documents. Safe, browser-local data processing, no account required.",
    };
  }

  if (slug === 'heic' || slug === 'heic-to-jpg-converter') {
    return {
      title: "HEIC to JPG Converter - 100% Free & Safe Browser Tool",
      description: "Batch convert HEIC images to JPG directly in your browser. Visual previews, no file uploads, 100% private on-device processing.",
    };
  }

  if (slug === 'heic-to-png') {
    return {
      title: "HEIC to PNG Converter - 100% Free & Safe Browser Tool",
      description: "Batch convert HEIC images to PNG directly in your browser. Lossless image conversion, no file uploads, 100% private on-device processing.",
    };
  }
  
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
  
  if (slug === 'uaf') {
    redirect('/tools/universal-ai-formatter');
  }
  
  if (slug === 'heic') {
    redirect('/tools/heic-to-jpg-converter');
  }
  
  return <DynamicToolClient slug={slug} />;
}
