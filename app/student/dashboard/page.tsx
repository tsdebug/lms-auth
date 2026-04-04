"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <div className="p-8 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <button
          onClick={() => void signOut().then(() => router.push("/login"))}
          className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
