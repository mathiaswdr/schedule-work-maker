"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type RequestDataType = {
  message: string;
  success: boolean;
  url?: string;
};

export default function PaymentDashboardClient() {
  const [loading, setLoading] = useState(false);
  const [requestData, setRequestData] = useState<RequestDataType | null>(null);

  useEffect(() => {
    // Afficher les messages de succès ou d'erreur
    if (requestData) {
      if (requestData.success) {
        toast.success(requestData.message);
      } else {
        toast.error(requestData.message);
      }

    //   // Si une URL est présente, rediriger vers Stripe
    //   if (requestData.url) {
    //     window.location.href = requestData.url;
    //   }
    }
  }, [requestData]);

  const handleRedirect = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/payment-dashboard", {
        method: "POST",
      });

      const data = await response.json();

      setRequestData(data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to create Stripe billing portal session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No URL found in response");
      }

    } catch (error) {
      console.error("Error during payment dashboard request:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create Stripe billing portal session."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleRedirect} disabled={loading}>
      {"Manage subscription"}
    </button>
  );
}
