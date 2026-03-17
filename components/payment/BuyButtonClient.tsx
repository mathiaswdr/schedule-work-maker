"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type RequestDataType = {
  message: string;
  redirect?: string;
  success: boolean;
  url: string;
}

type BuyButtonClientProps = {
  plan?: "STARTER" | "PRO";
};

export default function BuyButtonClient({ plan = "STARTER" }: BuyButtonClientProps) {
  const [loading, setLoading] = useState(false);
  const [requestData, setRequestData] = useState<RequestDataType>();

  useEffect(() => {
    if (!requestData) return;

    if(requestData?.success){
      toast.success(requestData?.message)
    } else{
      toast.error(requestData?.message)
    }
  }, [requestData])

  const handleBuy = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();
      setRequestData(data)

      if (!response.ok) {
        throw new Error(data.message || "Failed to create Stripe session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No URL found in response");
      }

    } catch (error) {
      console.error("Error during payment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create Stripe session"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleBuy} disabled={loading}>
      {"Upgrade to " + plan.toLowerCase()}
    </button>
  );
}
