"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <h1 className="text-2xl font-bold">Welcome to LMS 🎓</h1>
      <button
        onClick={() => void signOut().then(() => router.push("/signin"))}
        className="text-sm text-slate-500 hover:underline"
      >
        Sign Out
      </button>
    </div>
  );
}