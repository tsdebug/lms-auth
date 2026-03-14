"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 

export default function SignIn() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (step === "signUp") {
        await signIn("password", { 
          email, 
          password, 
          flow: "signUp", 
          role, 
          fName: "New", 
          lName: "User" 
        });
        
        if (role === "teacher") router.push("/teacher/dashboard");
        if (role === "student") router.push("/student/dashboard");

      } else {
        await signIn("password", { 
          email, 
          password, 
          flow: "signIn" 
        });
        router.push("/"); 
      }
    } catch (err) {
      setError("Failed to authenticate. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-lg mx-auto h-screen justify-center items-center px-4">
      <Card className="w-full max-w-sm shadow-2xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {step === "signIn" ? "Welcome back" : "Create an Account"}
          </CardTitle>
          <CardDescription>
            {step === "signIn" ? "Login to your account" : "Sign up as a Student or Teacher"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}

            <input 
              type="email" 
              placeholder="Email address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400" 
              required 
            />
            
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400" 
              required 
            />

            {step === "signUp" && (
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as "student" | "teacher")}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="student">I am a Student</option>
                <option value="teacher">I am a Teacher</option>
              </select>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Please wait..." : (step === "signIn" ? "Log In" : "Sign Up")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {step === "signIn" ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => {
                setStep(step === "signIn" ? "signUp" : "signIn");
                setError("");
              }} 
              className="font-medium text-blue-600 hover:underline"
            >
              {step === "signIn" ? "Sign Up" : "Log In"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}