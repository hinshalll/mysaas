import { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: "Our Vision & Core Philosophy",
  description: "Learn about our vision, secure cloud architecture, privacy-first design, and transparent pricing behind our high-performance utility tools.",
};

export default function AboutPage() {
  return <AboutClient />;
}
