import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Paiement reussi | Kronoma",
  description: "Confirmation de paiement Kronoma.",
  path: "/success",
  index: false,
});

export default function SuccessPage() {
  return (
    <div>
      <h1>Success page</h1>
    </div>
  );
}
