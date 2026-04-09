"use client"

import { useAuthActions } from "@convex-dev/auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

export default function ForgotPasswordPage() {
  const { signIn } = useAuthActions()
  const [step, setStep] = useState<"forgot" | { email: string }>("forgot")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (step === "forgot") {
    return (
      <div className="flex h-screen items-center justify-center">
        <form
          className="flex flex-col gap-4 w-full max-w-sm"
          onSubmit={async (e) => {
            e.preventDefault()
            setError("")
            setLoading(true)
            // CHANGED: using explicit object instead of FormData because
            // FormData can silently miss hidden inputs in some React/Next versions,
            // causing the flow field to not be sent — which was the bug
            const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value
            try {
              await signIn("password", { email, flow: "reset" })
              setStep({ email })
            } catch (err) {
              // CHANGED: logging real error to console so we can debug,
              // and showing actual message instead of hardcoded string
              console.error("Password reset request error:", err)
              setError(err instanceof Error ? err.message : "Something went wrong. Try again.")
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
            {/* No hidden inputs needed anymore — flow is passed directly in the object above */}
            <Input name="email" type="email" placeholder="m@example.com" required />
          </Field>
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

  return (
    <div className="flex h-screen items-center justify-center">
      <form
        className="flex flex-col gap-4 w-full max-w-sm border p-6 rounded-lg shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault()
          setError("")
          setLoading(true)
          const formData = new FormData(e.currentTarget)
          try {
            await signIn("password", formData)
            // Redirect to home upon success
            // WHY: Convex Auth automatically logs you in when you successfully reset a password.
            router.push("/")

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