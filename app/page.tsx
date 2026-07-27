"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Home() {
  const user = useQuery(api.users.queries.getCurrentUser)
  const router = useRouter()
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (user === undefined) {
      if (timeoutReached) {
        router.replace("/login")
      }
      return
    }

    if (user === null) {
      router.replace("/login")
      return
    }

    const roleNames = user.roles?.map((r) => r?.name).filter(Boolean) as string[]
    const isTeacher = roleNames.includes("teacher")
    const isStudent = roleNames.includes("student")

    if (isTeacher) {
      router.replace("/teacher/dashboard")
      return
    }

    if (isStudent) {
      router.replace("/student/dashboard")
      return
    }

    router.replace("/student/dashboard")
  }, [user, router, timeoutReached])

  return (
    <div className="flex h-screen items-center justify-center text-slate-400">
      Loading...
    </div>
  )
}