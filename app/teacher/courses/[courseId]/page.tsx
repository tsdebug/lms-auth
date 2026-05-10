"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ChapterList } from "@/components/courses/ChapterList"

export default function CourseEditorPage() {
  const params = useParams()
  const courseId = params.courseId as Id<"courses">

  const courseContent = useQuery(
    api.chapters.queries.getCourseContent,
    { courseId }
  )

  if (courseContent === undefined) {
    return <div>Loading...</div>
  }

  if (courseContent === null) {
    return <div>Course not found</div>
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* course header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{courseContent.title}</h1>
              <span className="text-sm text-muted-foreground capitalize">
                {courseContent.status}
              </span>
            </div>
          </div>

          {/* chapter list */}
          <ChapterList
            courseId={courseId}
            chapters={courseContent.chapters}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}