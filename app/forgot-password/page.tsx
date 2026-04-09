"use client"

import { useAuthActions } from "@convex-dev/auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

export default function ForgotPasswordPage() {
  const { signIn } = useAuthActions()
  const [step, setStep] = useState<"forgot" | { email: string }>("forgot")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Step 1: user enters email → triggers OTP send
  if (step === "forgot") {
    return (
      <div className="flex h-screen items-center justify-center">
        <form
          className="flex flex-col gap-4 w-full max-w-sm"
          onSubmit={async (e) => {
            e.preventDefault()
            setError("")
            setLoading(true)
            const formData = new FormData(e.currentTarget)
            try {
              await signIn("password", formData) // flow="reset" is in the hidden input
              setStep({ email: formData.get("email") as string })
            } catch {
              setError("No account found with that email.")
            } finally {
              setLoading(false)
            }
          }}
        >
          <h1 className="text-2xl font-bold">Forgot password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a reset code.
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input name="email" type="email" placeholder="m@example.com" required />
          </Field>
          {/* This hidden input tells Convex Auth which flow to run */}
          <input name="flow" type="hidden" value="reset" />
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset code"}
          </Button>
          <a href="/login" className="text-sm text-center underline underline-offset-4">
            Back to login
          </a>
        </form>
      </div>
    )
  }

  // Step 2: user enters OTP code + new password
  return (
    <div className="flex h-screen items-center justify-center">
      <form
        className="flex flex-col gap-4 w-full max-w-sm"
        onSubmit={async (e) => {
          e.preventDefault()
          setError("")
          setLoading(true)
          const formData = new FormData(e.currentTarget)
          try {
            await signIn("password", formData) // flow="reset-verification"
            // on success, Convex Auth signs the user in and the middleware
            // will redirect them to "/" which goes to their dashboard
          } catch {
            setError("Invalid or expired code. Please try again.")
          } finally {
            setLoading(false)
          }
        }}
      >
        <h1 className="text-2xl font-bold">Enter reset code</h1>
        <p className="text-sm text-muted-foreground">
          Check your email at <strong>{step.email}</strong> for an 8-digit code.
        </p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Field>
          <FieldLabel>Reset code</FieldLabel>
          <Input name="code" type="text" placeholder="12345678" required />
        </Field>
        <Field>
          <FieldLabel>New password</FieldLabel>
          <Input name="newPassword" type="password" required />
        </Field>
        {/* These hidden inputs carry data Convex Auth needs */}
        <input name="email" type="hidden" value={step.email} />
        <input name="flow" type="hidden" value="reset-verification" />
        <Button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </Button>
        <button
          type="button"
          className="text-sm underline underline-offset-4"
          onClick={() => setStep("forgot")}
        >
          Back
        </button>
      </form>
    </div>
  )
}