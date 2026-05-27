"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpenIcon, CheckCircleIcon, LockIcon } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as Id<"courses">

  // course content — chapters + lessons
  const course = useQuery(api.courses.queries.getCourseDetails, { courseId })

  // enrollment status — null = not enrolled, object = enrolled
  // used to decide whether to show Enroll or Go to Course
  const enrollment = useQuery(api.enrollments.queries.getEnrollmentStatus, { courseId })

  const createEnrollment = useMutation(api.enrollments.mutations.createEnrollment)
  const [enrolling, setEnrolling] = useState(false)

  async function handleEnroll() {
    setEnrolling(true)
    try {
      await createEnrollment({ courseId })
      toast.success("Enrolled successfully!")
      // go straight to the student courses view after enrolling
      router.push("/student/courses")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enroll")
    } finally {
      setEnrolling(false)
    }
  }

  // loading state — course and enrollment both need to resolve
  if (course === undefined || enrollment === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (course === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Course not found.</p>
      </div>
    )
  }

  const isEnrolled = enrollment !== null
  const totalLessons = course.chapters.reduce(
    (sum, chapter) => sum + chapter.lessons.length,
    0
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* course header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {course.difficultyLevel && (
              <Badge variant="secondary" className="capitalize">
                {course.difficultyLevel}
              </Badge>
            )}
            <Badge variant="outline" className="capitalize">
              {course.status}
            </Badge>
          </div>

          <h1 className="text-3xl font-bold">{course.title}</h1>

          {course.description && (
            <p className="text-muted-foreground leading-relaxed">
              {course.description}
            </p>
          )}

          {/* stats row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{course.chapters.length} chapters</span>
            <span>·</span>
            <span>{totalLessons} lessons</span>
          </div>

          {/* enroll / go to course CTA */}
          <div className="flex items-center gap-3 pt-2">
            {isEnrolled ? (
              <>
                <Button onClick={() => router.push("/student/courses")}>
                  <CheckCircleIcon className="size-4 mr-1.5" />
                  Go to My Courses
                </Button>
                <span className="text-sm text-muted-foreground">
                  You are enrolled
                </span>
              </>
            ) : (
              <Button onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? "Enrolling..." : "Enroll in this course"}
              </Button>
            )}
          </div>
        </div>

        {/* divider */}
        <div className="border-t mb-6" />

        {/* course content — chapters and lessons */}
        <h2 className="text-lg font-semibold mb-4">Course content</h2>

        {course.chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No content yet. Check back soon.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {course.chapters.map((chapter, ci) => (
              <div key={chapter._id} className="rounded-lg border">

                {/* chapter header */}
                <div className="px-4 py-3 bg-muted/30 rounded-t-lg border-b">
                  <p className="text-sm font-medium">
                    Chapter {ci + 1}: {chapter.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* lesson list */}
                <div className="divide-y">
                  {chapter.lessons.map((lesson, li) => (
                    <div
                      key={lesson._id}
                      className="px-4 py-3 flex items-center gap-3"
                    >
                      {/* show lock icon if not enrolled, book if enrolled */}
                      {isEnrolled ? (
                        <BookOpenIcon className="size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <LockIcon className="size-4 text-muted-foreground shrink-0" />
                      )}

                      <span className="text-sm">
                        {li + 1}. {lesson.title}
                      </span>

                      {/* if enrolled, allow navigating directly to lesson */}
                      {isEnrolled && (
                        <button
                          className="ml-auto text-xs text-primary hover:underline"
                          onClick={() =>
                            router.push(
                              `/student/courses/${courseId}/lessons/${lesson._id}`
                            )
                          }
                        >
                          Start
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}