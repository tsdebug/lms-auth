"use client" 

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuthActions } from "@convex-dev/auth/react" // added
import { useRouter } from "next/navigation" // added
import { useState } from "react" // added

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { signIn } = useAuthActions() // added
  const router = useRouter() // added
  const [fName, setFName] = useState("") // added
  const [lName, setLName] = useState("") // added
  const [email, setEmail] = useState("") // added
  const [password, setPassword] = useState("") // added
  const [confirmPassword, setConfirmPassword] = useState("") // added
  const [role, setRole] = useState<"student" | "teacher">("student") // added
  const [error, setError] = useState("") // added
  const [loading, setLoading] = useState(false) // added

  // added: wires form to Convex Auth
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      await signIn("password", { email, password, flow: "signUp", fName, lName, role })
      if (role === "teacher") router.push("/teacher/dashboard")
      else router.push("/student/dashboard")
    } catch (err) {
      setError("Failed to create account. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}> {/* added: onSubmit */}
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Fill in the form below to create your account
          </p>
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>} {/* added: error */}
        {/* CHANGED: split Full Name into First Name + Last Name */}
        <div className="flex gap-3">
          <Field className="flex-1">
            <FieldLabel htmlFor="fName">First Name</FieldLabel>
            <Input
              id="fName"
              type="text"
              placeholder="John"
              required
              className="bg-background"
              value={fName} // added
              onChange={(e) => setFName(e.target.value)} // added
            />
          </Field>
          <Field className="flex-1">
            <FieldLabel htmlFor="lName">Last Name</FieldLabel>
            <Input
              id="lName"
              type="text"
              placeholder="Doe"
              required
              className="bg-background"
              value={lName} // added
              onChange={(e) => setLName(e.target.value)} // added
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            className="bg-background"
            value={email} // added
            onChange={(e) => setEmail(e.target.value)} // added
          />
          <FieldDescription>
            We&apos;ll use this to contact you. We will not share your email
            with anyone else.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            required
            className="bg-background"
            value={password} // added
            onChange={(e) => setPassword(e.target.value)} // added
          />
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            required
            className="bg-background"
            value={confirmPassword} // added
            onChange={(e) => setConfirmPassword(e.target.value)} // added
          />
          <FieldDescription>Please confirm your password.</FieldDescription>
        </Field>
        {/* added: role selector — required for LMS */}
        <Field>
          <FieldLabel htmlFor="role">I am a</FieldLabel>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "student" | "teacher")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </Field>
        <Field>
          <Button type="submit" disabled={loading}> {/* ADDED: disabled */}
            {loading ? "Creating account..." : "Create Account"} {/* ADDED: loading state */}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            Sign up with GitHub
          </Button>
          <FieldDescription className="px-6 text-center">
            Already have an account?{" "}
            <a href="/login" className="underline underline-offset-4"> {/* Changed: href to /login */}
              Sign in
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}