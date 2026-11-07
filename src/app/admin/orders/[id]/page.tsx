"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminOrderRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  useEffect(() => {
    if (id) {
      router.replace(`/admin/orders?highlight=${id}`);
    } else {
      router.replace("/admin/orders");
    }
  }, [id, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#B8945F]/30 border-t-[#B8945F] rounded-full animate-spin mb-3"></div>
      <p className="text-xs text-stone-500 font-sans">Redirecting to order details...</p>
    </div>
  );
}

