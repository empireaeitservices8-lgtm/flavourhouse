"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getAdminToken, fetchFromBackend } from "@/lib/api";
import { CommonAuthCard } from "@/components/auth/CommonAuthCard";

function AdminRootContent() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setIsVerifying(false);
      return;
    }

    fetchFromBackend("/api/admin/auth/me")
      .then((res) => {
        if (res.ok && res.data?.admin) {
          setIsAuthenticated(true);
          router.replace("/admin/dashboard");
        } else {
          setIsVerifying(false);
        }
      })
      .catch(() => {
        setIsVerifying(false);
      });
  }, [router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <CommonAuthCard mode="admin" initialTab="login" returnUrlOverride="/admin/dashboard" />;
}

export default function AdminRootPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-cream flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <AdminRootContent />
    </Suspense>
  );
}
