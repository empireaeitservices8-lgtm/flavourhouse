"use client";

import { Suspense } from "react";
import { CommonAuthCard } from "@/components/auth/CommonAuthCard";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-cream flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <CommonAuthCard mode="customer" initialTab="login" />
    </Suspense>
  );
}

