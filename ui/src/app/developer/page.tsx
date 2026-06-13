import { Metadata } from 'next';
import DeveloperClient from './DeveloperClient';

export const metadata: Metadata = {
  title: "Developer Sandbox Console",
  description: "Access sandbox credentials, monitor query volumes, rotate secure access tokens, and check server nodes health matrix in real-time.",
};

export default function DeveloperPage() {
  return <DeveloperClient />;
}
