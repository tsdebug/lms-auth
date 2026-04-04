"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthActions } from "@convex-dev/auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  // Convex Auth signIn function and router for redirect after login
  const { signIn } = useAuthActions()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // CHANGED: wired to Convex Auth signIn with signIn flow
      await signIn("password", {
        email,
        password,
        flow: "signIn",
      })
      // redirect to home — page.tsx will handle role-based redirect
      router.push("/")
    } catch (err) {
      console.error(err)
      setError("Invalid email or password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    // CHANGED: added onSubmit handler
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>

      {/* ADDED: error message display */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        Don&apos;t have an account?{" "}
        {/* CHANGED: link to signup page */}
        <a href="/signup" className="underline underline-offset-4">
          Sign up
        </a>
      </p>
    </form>
  )
}