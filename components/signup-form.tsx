"use client"

// ADDED: all auth and routing imports needed to wire the form to Convex Auth
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthActions } from "@convex-dev/auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  // ADDED: Convex Auth signIn function and Next.js router for redirect after signup
  const { signIn } = useAuthActions()
  const router = useRouter()

  // ADDED: form state for all fields
  const [fName, setFName] = useState("")
  const [lName, setLName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"student" | "teacher">("student")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // ADDED: form submit handler — calls Convex Auth signIn with signup flow
  // role is passed here and picked up by profile() in convex/auth.ts
  // then createOrUpdateUser writes to user_roles server-side
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // ADDED: password match check before submitting
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      await signIn("password", {
        email,
        password,
        flow: "signUp",
        fName,
        lName,
        role,
      })

      // ADDED: redirect to correct dashboard based on selected role
      if (role === "teacher") router.push("/teacher/dashboard")
      else router.push("/student/dashboard")

    } catch (err) {
      console.error(err)
      setError("Failed to create account. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    // CHANGED: added onSubmit handler to wire form to Convex Auth
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Fill in the form below to create your account
        </p>
      </div>

      {/* ADDED: error message display */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <div className="flex gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <Label htmlFor="fName">First Name</Label>
          {/* CHANGED: added value and onChange to connect to state */}
          <Input
            id="fName"
            type="text"
            placeholder="John"
            required
            value={fName}
            onChange={(e) => setFName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <Label htmlFor="lName">Last Name</Label>
          <Input
            id="lName"
            type="text"
            placeholder="Doe"
            required
            value={lName}
            onChange={(e) => setLName(e.target.value)}
          />
        </div>
      </div>

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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {/* ADDED: role selector — student or teacher */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="role">I am a</Label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as "student" | "teacher")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {/* CHANGED: show loading state while submitting */}
        {loading ? "Creating account..." : "Create Account"}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        {/* CHANGED: link to signin page instead of # */}
        <a href="/signin" className="underline underline-offset-4">
          Sign in
        </a>
      </p>
    </form>
  )
}