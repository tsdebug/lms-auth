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
import { ClipboardListIcon, MailIcon, LayersIcon } from "lucide-react"

export default function TeacherDashboardPage() {
  const highlights = useQuery(api.dashboard.queries.getTeacherDashboardHighlights)

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
              <SectionCards role="teacher" />

              <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-6">

                {/* Ungraded Submissions */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Needs Grading</CardTitle>
                    <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {highlights === undefined && (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    )}
                    {highlights && highlights.ungradedSubmissions.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nothing waiting on you.</p>
                    )}
                    {highlights?.ungradedSubmissions.map((s) => (
                      <Link
                        key={s.submissionId}
                        href={`/teacher/assignments/${s.assignmentId}`}
                        className="flex items-center justify-between text-sm hover:underline"
                      >
                        <span className="truncate">{s.studentName}</span>
                        <span className="text-muted-foreground truncate shrink-0 max-w-[45%]">
                          {s.assignmentTitle}
                        </span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                {/* Pending Invitations */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {highlights === undefined && (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    )}
                    {highlights && highlights.pendingInvitations.length === 0 && (
                      <p className="text-sm text-muted-foreground">No pending invites.</p>
                    )}
                    {highlights?.pendingInvitations.map((i) => (
                      <Link
                        key={i.invitationId}
                        href={`/teacher/courses/${i.courseId}/edit`}
                        className="text-sm truncate hover:underline"
                      >
                        {i.email}
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                {/* Upcoming/Active Batches */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Batches</CardTitle>
                    <LayersIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {highlights === undefined && (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    )}
                    {highlights && highlights.upcomingBatches.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nothing starting soon.</p>
                    )}
                    {highlights?.upcomingBatches.map((b) => (
                      <Link
                        key={b.batchId}
                        href={`/teacher/batches/${b.batchId}`}
                        className="flex items-center justify-between text-sm hover:underline"
                      >
                        <span className="truncate">{b.name}</span>
                        <Badge variant="outline" className="shrink-0 capitalize">
                          {b.status}
                        </Badge>
                      </Link>
                    ))}
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