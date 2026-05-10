"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ChapterList } from "@/components/courses/ChapterList"
import { CourseEditForm } from "@/components/course-edit-form"
import { Badge } from "@/components/ui/badge"

export default function CourseEditorPage() {
  const params = useParams()
  const courseId = params.courseId as Id<"courses">

  const courseContent = useQuery(
    api.chapters.queries.getCourseContent,
    { courseId }
  )

  if (courseContent === undefined) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>
  }

  if (courseContent === null) {
    return <div className="p-6 text-sm text-muted-foreground">Course not found</div>
  }

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
        <div className="flex flex-1 flex-col gap-8 p-6">

          {/* section 1 — course details */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{courseContent.title}</h1>
              <Badge variant="outline" className="capitalize">
                {courseContent.status}
              </Badge>
            </div>
            <CourseEditForm
              courseId={courseId}
              initialData={{
                title: courseContent.title,
                description: courseContent.description,
                difficultyLevel: courseContent.difficultyLevel,
                slug: courseContent.slug,
                thumbnailUrl: courseContent.thumbnailUrl,
                categoryIds: courseContent.categoryIds,  // ← pass pre-selected categories
              }}
            />
          </div>

          {/* divider */}
          <div className="border-t" />

          {/* section 2 — chapters and lessons */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Content</h2>
            <ChapterList
              courseId={courseId}
              chapters={courseContent.chapters}
            />
          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}