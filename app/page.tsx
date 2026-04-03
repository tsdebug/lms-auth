"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, 5000); // 5 seconds timeout

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user === undefined) {
      if (timeoutReached) {
        router.replace("/signin");
      }

      return;
    }
    if (user === null) {
      router.replace("/signin");
      return;
    }


    const selectedRole = (user.role as string | null) ??
      (user.roles?.[0]?.name as string | undefined);

    if (selectedRole === "teacher") {
      router.replace("/teacher/dashboard");
    } else if (selectedRole === "student") {
      router.replace("/student/dashboard");
    } else {
      router.replace("/student/dashboard");
    }
  }, [user, router, timeoutReached]);

  return (
    <div className="flex h-screen items-center justify-center text-slate-400">
      Loading...
    </div>
  );
}
