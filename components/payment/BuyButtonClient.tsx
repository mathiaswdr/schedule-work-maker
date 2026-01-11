"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { redirect } from "next/navigation";
import { toast } from "sonner";

type RequestDataType = {
  message: string;
  redirect?: string;
  success: boolean;
  url: string;
}



export default function BuyButtonClient() {
  const [loading, setLoading] = useState(false);
  const [requestData, setRequestData] = useState<RequestDataType>();


  useEffect(() => {


    if(requestData?.success){
      toast.success(requestData?.message)

    } else{
      toast.error(requestData?.message)
    }

    if(requestData?.redirect) redirect(requestData.redirect)


  }, [requestData])

  const handleBuy = async () => {
    setLoading(true);

    try {
      // Appel à l'API pour créer la session Stripe
      const response = await fetch("/api/checkout", {
        method: "POST",
      });



      if (!response.ok) {
        throw new Error("Failed to create Stripe session");
      }

      const data = await response.json();

      setRequestData(data)

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No URL found in response");
      }


    } catch (error) {
      console.error("Error during payment:", error);
      // Gérer les erreurs de manière appropriée
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleBuy} disabled={loading}>
      {"Upgrade to master plan"}
    </button>
  );
}