"use client"

// Student progress page
// ROUTE: /student/progress
// WHAT: one place to see learning progress across all enrolled courses
// DATA: pulls from 3 existing queries — no new backend needed
//   - getEnrollmentsByStudent → per course progress + lesson counts
//   - getAllQuizzesForStudent → quiz attempts and scores per course
//   - getMyCertificates → which courses are fully completed

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BookOpenIcon, CheckCircleIcon, TrendingUpIcon,
  AwardIcon, ChevronRightIcon,
} from "lucide-react"

export default function StudentProgressPage() {
  const router = useRouter()

  // step 1: fetch all three data sources in parallel
  // WHY: Convex runs these simultaneously, no waterfall
  const enrollments = useQuery(api.enrollments.queries.getEnrollmentsByStudent)
  const quizGroups = useQuery(api.quizzes.queries.getAllQuizzesForStudent)
  const certificates = useQuery(api.certificates.queries.getMyCertificates)

  const loading =
    enrollments === undefined ||
    quizGroups === undefined ||
    certificates === undefined

  if (loading) {
    return (
      <SidebarProvider style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // step 2: compute overall stats from the fetched data
  const totalEnrolled = enrollments.length
  const totalCompleted = enrollments.filter(
    (e: any) => e.enrollmentStatus === "completed"
  ).length

  // flatten all quizzes across all courses to count attempts
  const allQuizzes = (quizGroups ?? []).flatMap((g: any) => g.quizzes)
  const attemptedQuizzes = allQuizzes.filter((q: any) => q.attempted)
  const totalQuizzesTaken = attemptedQuizzes.length

  // avg quiz score across all attempted quizzes
  const avgQuizScore =
    attemptedQuizzes.length > 0
      ? Math.round(
          attemptedQuizzes.reduce((sum: number, q: any) => {
            const pct =
              q.maxScore > 0 ? (q.score / q.maxScore) * 100 : 0
            return sum + pct
          }, 0) / attemptedQuizzes.length
        )
      : null

  const totalCertificates = certificates.length

  // step 3: build a quiz lookup map keyed by courseId
  // WHY: when rendering per-course cards we want quick access
  // to that course's quiz stats without re-filtering every time
  const quizStatsByCourse = new Map<
    string,
    { taken: number; avgScore: number | null }
  >()

  for (const group of quizGroups ?? []) {
  if (!group) continue 
  const attempted = group.quizzes.filter((q: any) => q.attempted)
  const avg =
    attempted.length > 0
      ? Math.round(
          attempted.reduce((sum: number, q: any) => {
            const pct = q.maxScore > 0 ? (q.score / q.maxScore) * 100 : 0
            return sum + pct
          }, 0) / attempted.length
        )
      : null

  quizStatsByCourse.set(group.courseId, {
    taken: attempted.length,
    avgScore: avg,
  })
}

  return (
    <SidebarProvider style={{
      "--sidebar-width": "calc(var(--spacing) * 72)",
      "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-8 p-6">

          {/* page header */}
          <div>
            <h1 className="text-2xl font-semibold">My Progress</h1>
            <p className="text-sm text-muted-foreground">
              Your learning journey across all courses
            </p>
          </div>

          {/* overall stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            <div className="rounded-xl border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Enrolled</p>
                <BookOpenIcon className="size-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold">{totalEnrolled}</p>
              <p className="text-xs text-muted-foreground">
                {totalCompleted} completed
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Lessons done</p>
                <CheckCircleIcon className="size-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold">
                {enrollments.reduce(
                  (sum: number, e: any) => sum + (e.completedLessons ?? 0),
                  0
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                of{" "}
                {enrollments.reduce(
                  (sum: number, e: any) => sum + (e.totalLessons ?? 0),
                  0
                )}{" "}
                total
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Quiz avg</p>
                <TrendingUpIcon className="size-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold">
                {avgQuizScore !== null ? `${avgQuizScore}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalQuizzesTaken} quiz{totalQuizzesTaken !== 1 ? "zes" : ""} taken
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Certificates</p>
                <AwardIcon className="size-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold">{totalCertificates}</p>
              <p className="text-xs text-muted-foreground">
                {totalCertificates === 1 ? "course" : "courses"} completed
              </p>
            </div>

          </div>

          {/* empty state */}
          {enrollments.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <BookOpenIcon className="size-12 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No courses yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enroll in a course to start tracking your progress.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/courses")}
              >
                Browse courses
              </Button>
            </div>
          )}

          {/* per-course breakdown */}
          {enrollments.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-semibold">Course breakdown</h2>

              <div className="flex flex-col gap-3">
                {enrollments.map((enrollment: any) => {
                  const quizStats = quizStatsByCourse.get(
                    enrollment.courseId
                  )
                  const hasCert = certificates.some(
                    (c: any) => c.courseId === enrollment.courseId
                  )

                  return (
                    <div
                      key={enrollment.id}
                      className="rounded-xl border bg-card p-5 flex flex-col gap-4"
                    >
                      {/* course header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-tight truncate">
                            {enrollment.courseTitle}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {enrollment.instructorName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {hasCert && (
                            <AwardIcon className="size-4 text-amber-500" />
                          )}
                          <Badge
                            variant="outline"
                            className={
                              enrollment.enrollmentStatus === "completed"
                                ? "bg-green-100 text-green-700 border-0"
                                : "capitalize"
                            }
                          >
                            {enrollment.enrollmentStatus}
                          </Badge>
                        </div>
                      </div>

                      {/* lesson progress bar */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Lessons</span>
                          <span>
                            {enrollment.completedLessons ?? 0}/
                            {enrollment.totalLessons ?? 0}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${enrollment.progressPercent ?? 0}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {enrollment.progressPercent ?? 0}% complete
                        </p>
                      </div>

                      {/* quiz stats */}
                      <div className="flex items-center gap-6 text-xs text-muted-foreground border-t pt-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {quizStats?.taken ?? 0}
                          </p>
                          <p>quizzes taken</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {quizStats?.avgScore !== null &&
                            quizStats?.avgScore !== undefined
                              ? `${quizStats.avgScore}%`
                              : "—"}
                          </p>
                          <p>avg quiz score</p>
                        </div>
                        {hasCert && (
                          <div
                            className="ml-auto cursor-pointer text-primary hover:underline flex items-center gap-1"
                            onClick={() =>
                              router.push("/student/certificates")
                            }
                          >
                            View certificate
                          </div>
                        )}
                      </div>

                      {/* continue button */}
                      {enrollment.enrollmentStatus !== "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-fit"
                          onClick={() =>
                            router.push(
                              `/student/courses/${enrollment.courseId}`
                            )
                          }
                        >
                          Continue course
                          <ChevronRightIcon className="size-3.5 ml-1" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}