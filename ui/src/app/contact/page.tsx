import { Metadata } from "next";
import { App } from "../page";

export const metadata: Metadata = {
  title: "Contact Us - MySaaS Tools Hub",
  description: "Get in touch with the MySaaS team. Feature requests, bug reports, partnership opportunities, and general inquiries.",
};

export default function ContactPage() {
  return <App initialSlug="contact" />;
}
