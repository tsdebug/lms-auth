"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ChapterList } from "@/components/courses/ChapterList"
import { CourseEditForm } from "@/components/course-edit-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion"
import { CheckCircle2Icon } from "lucide-react"

export default function CourseEditorPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as Id<"courses">

  // controls whether the details accordion is open — starts collapsed
  const [detailsOpen, setDetailsOpen] = useState<string | undefined>(undefined)

  const courseContent = useQuery(api.chapters.queries.getCourseContent, { courseId })

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

          {/* section 1 — course details, its own Card, contents collapse via accordion */}
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="pb-0">
              <Accordion
                type="single"
                collapsible
                value={detailsOpen}
                onValueChange={setDetailsOpen}
              >
                <AccordionItem value="details" className="border-b-0">
                  <AccordionTrigger className="py-0 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-semibold">{courseContent.title}</h1>
                      <Badge variant="outline" className="capitalize">
                        {courseContent.status}
                      </Badge>
                      <span className="text-sm font-normal text-muted-foreground">
                        Edit details
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CourseEditForm
                      courseId={courseId}
                      initialData={{
                        title: courseContent.title,
                        description: courseContent.description,
                        difficultyLevel: courseContent.difficultyLevel,
                        slug: courseContent.slug,
                        thumbnailUrl: courseContent.thumbnailUrl,
                        categoryIds: courseContent.categoryIds,
                      }}
                      onDone={() => setDetailsOpen(undefined)}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardHeader>
          </Card>

          {/* section 2 — chapters and lessons, its own Card, as before */}
          <Card className="border-muted/60 shadow-sm">
            <CardHeader>
              <h2 className="text-lg font-semibold">Content</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ChapterList courseId={courseId} chapters={courseContent.chapters} />

              <div className="flex justify-end pt-4">
                <Button onClick={() => router.push("/teacher/courses")}>
                  <CheckCircle2Icon className="size-4 mr-1.5" />
                  Done — Back to My Courses
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}