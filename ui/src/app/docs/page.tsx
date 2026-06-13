import { Metadata } from 'next';
import DocsClient from './DocsClient';

export const metadata: Metadata = {
  title: "API & Technical Docs",
  description: "Read documentation on utilizing our serverless AI formatting API, sandbox limits, response formats, and client integrations.",
};

export default function DocsPage() {
  return <DocsClient />;
}
