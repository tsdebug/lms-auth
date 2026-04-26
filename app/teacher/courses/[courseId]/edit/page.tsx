"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { CourseEditForm } from "@/components/course-edit-form"
import { useParams } from "next/navigation"

export default function EditCoursePage() {
  const params = useParams()
  const courseId = params.courseId as string
  
  const course = useQuery(api.courses.queries.getCourseDetails, { courseId: courseId as any })

  if (course === undefined) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="text-sm text-muted-foreground">Loading course...</div>
      </main>
    )
  }

  if (!course) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="text-sm text-destructive">Course not found</div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Course Editor</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Edit your course details below, then continue with chapters and lessons.
      </p>
      
      <div className="mt-8">
        <CourseEditForm
          courseId={courseId}
          initialTitle={course.title}
          initialDescription={course.description}
          initialDifficultyLevel={course.difficultyLevel}
          initialSlug={course.slug}
          initialThumbnailUrl={course.thumbnailUrl}
        />
      </div>
    </main>
  )
}
