import { Fraunces } from "next/font/google";
import InvoicesClient from "@/components/dashboard/invoices-client";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export default function DashboardInvoicesPage() {
  return <InvoicesClient displayClassName={display.className} />;
}
