import { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: "Console Dashboard",
  description: "Access your dashboard workspace, manage tool runs, check subscription usage stats, and quickly search through 20+ specialized utility modules.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
