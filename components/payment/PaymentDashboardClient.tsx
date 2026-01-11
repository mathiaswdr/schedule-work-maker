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
      // Appel à l'API pour générer la session Stripe du tableau de bord de gestion
      const response = await fetch("/api/payment-dashboard", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create Stripe billing portal session");
      }

      const data = await response.json();

      setRequestData(data); // Mettre à jour l'état avec les données reçues

    if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No URL found in response");
      }

    } catch (error) {
      console.error("Error during payment dashboard request:", error);
      toast.error("An unexpected error occurred.");
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