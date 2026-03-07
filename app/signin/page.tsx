"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { Github } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import Image from "next/image";

export default function SignIn() {
  const { signIn } = useAuthActions();

  return (
    <div className="flex flex-col gap-8 w-full max-w-lg mx-auto h-screen justify-center items-center px-4">

      {/* Login Card */}
      <Card className="w-full max-w-xs shadow-2xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your Github account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 font-semibold"
            onClick={() => void signIn("github", { redirectTo: "/" })}
          >
            <Github className="h-5 w-5" />
            Login with Github
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}