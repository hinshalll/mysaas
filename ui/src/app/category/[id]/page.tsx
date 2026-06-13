import { Metadata } from "next";
import CategoryHubClient from "./CategoryHubClient";
import { CATEGORIES } from "../../config";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

// Generate dynamic SEO metadata dynamically tailored for Google Search
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  const matchedCategory = CATEGORIES.find(c => c.id === id);
  const categoryLabel = matchedCategory ? matchedCategory.label : "Utility Suite";
  const tagline = matchedCategory ? matchedCategory.tagline : "Lightweight online developer and creator tools catalog.";
  
  return {
    title: `${categoryLabel} Tools Catalog - Premium Utilities Hub`,
    description: `${tagline} High-performance, clean, on-device operations.`,
  };
}

export default async function DynamicCategoryPage({ params }: Props) {
  const { id } = await params;
  
  return <CategoryHubClient categoryId={id} />;
}

