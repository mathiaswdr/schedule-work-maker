import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Profil | Kronoma",
  description: "Consultez et modifiez votre profil Kronoma.",
  path: "/profile",
  index: false,
});

export default function ProfileHome() {
  return (
    <div>
      <h1>Profile</h1>
    </div>
  );
}
