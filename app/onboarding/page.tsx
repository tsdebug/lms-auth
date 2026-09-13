"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function OnboardingPage() {
  const router = useRouter()
  const user = useQuery(api.users.queries.getCurrentUser)
  const createUserProfile = useMutation(api.users.mutations.createUserProfile)
  const [fName, setFName] = useState("")
  const [lName, setLName] = useState("")
  const [role, setRole] = useState<"student" | "teacher">("student")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user === null) router.replace("/login")
    if (user?.roles?.length) router.replace("/")
  }, [router, user])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSaving(true)

    try {
      await createUserProfile({ fName, lName, role })
      router.replace(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard")
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not finish setup")
      setSaving(false)
    }
  }

  if (user === undefined || user === null || user.roles?.length) return null

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Set up your account</CardTitle>
          <CardDescription>Choose how you will use Vidya Setu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fName">First name</Label>
                <Input id="fName" value={fName} onChange={(event) => setFName(event.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lName">Last name</Label>
                <Input id="lName" value={lName} onChange={(event) => setLName(event.target.value)} required />
              </div>
            </div>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">I want to join as</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={role === "student"}
                    onChange={() => setRole("student")}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium">Student</span>
                    <span className="block text-xs text-muted-foreground">Learn from courses and take quizzes.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={role === "teacher"}
                    onChange={() => setRole("teacher")}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium">Teacher</span>
                    <span className="block text-xs text-muted-foreground">Create courses and teach students.</span>
                  </span>
                </label>
              </div>
            </fieldset>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={saving}>
              {saving ? "Finishing setup..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
