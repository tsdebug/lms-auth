"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return; // still loading
    if (user === null) return;      // proxy handles unauthed users

    if (user.role === "teacher") router.replace("/teacher/dashboard");
    if (user.role === "student") router.replace("/student/dashboard");
  }, [user, router]);

  return (
    <div className="flex h-screen items-center justify-center text-slate-400">
      Loading...
    </div>
  );
}
