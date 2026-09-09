"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClipboardListIcon, FileQuestionIcon, PlayCircleIcon } from "lucide-react"

export default function StudentDashboardPage() {
  const highlights = useQuery(api.dashboard.queries.getStudentDashboardHighlights)

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards role="student" />

              <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-6">

                {/* Continue Learning */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Continue Learning</CardTitle>
                    <PlayCircleIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {highlights === undefined && (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    )}
                    {highlights?.continueCourse ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">{highlights.continueCourse.title}</p>
                        <Button asChild size="sm" className="w-fit">
                          <Link href={`/courses/${highlights.continueCourse.courseId}`}>
                            Continue
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      highlights && (
                        <p className="text-sm text-muted-foreground">
                          Enroll in a course to get started.
                        </p>
                      )
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Assignments */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Assignments</CardTitle>
                    <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {highlights === undefined && (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    )}
                    {highlights && highlights.upcomingAssignments.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nothing due soon.</p>
                    )}
                    {highlights?.upcomingAssignments.map((a) => (
                      <div key={a.assignmentId} className="flex items-center justify-between text-sm">
                        <span className="truncate">{a.title}</span>
                        <Badge variant={a.isOverdue ? "destructive" : "outline"} className="shrink-0">
                          {a.isOverdue ? "Overdue" : a.dueDate}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Pending Quizzes */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quizzes To Take</CardTitle>
                    <FileQuestionIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {highlights === undefined && (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    )}
                    {highlights && highlights.pendingQuizzes.length === 0 && (
                      <p className="text-sm text-muted-foreground">All caught up.</p>
                    )}
                    {highlights?.pendingQuizzes.map((q) => {
                      const quizHref = q.courseId && q.navigationLessonId
                        ? `/student/courses/${q.courseId}/lessons/${q.navigationLessonId}?section=quiz`
                        : "/student/quizzes"

                      return (
                        <div key={q.quizId} className="flex flex-col gap-2">
                          <p className="text-sm font-medium truncate">{q.title}</p>
                          <Button asChild size="sm" className="w-fit">
                            <Link href={quizHref}>Take quiz</Link>
                          </Button>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}