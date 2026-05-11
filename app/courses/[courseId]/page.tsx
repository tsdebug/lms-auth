"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpenIcon,
  ChevronRightIcon,
  UserIcon,
  LockIcon,
  CheckCircleIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as Id<"courses">

  // fetch course details — chapters and lessons
  const course = useQuery(api.courses.queries.getCourseDetails, { courseId })

  // check if current user is enrolled
  const enrollment = useQuery(api.enrollments.queries.getEnrollmentStatus, {
    courseId,
  })

  const enroll = useMutation((api as any)["enrollments/mutations"].createEnrollment)
  const [enrolling, setEnrolling] = useState(false)

  async function handleEnroll() {
    setEnrolling(true)
    try {
      await enroll({ courseId })
      toast.success("Successfully enrolled!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enroll")
    } finally {
      setEnrolling(false)
    }
  }

  if (course === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (course === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    )
  }

  const isEnrolled = enrollment?.status === "active" ||
    enrollment?.status === "completed"

  return (
    <div className="min-h-screen bg-background">
      {/* back button */}
      <div className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push("/courses")}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            ← Back to courses
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* left — course info */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* thumbnail */}
            <div className="aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpenIcon className="size-16 text-muted-foreground" />
              )}
            </div>

            {/* title + meta */}
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-bold">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                {course.difficultyLevel && (
                  <Badge variant="outline" className="capitalize">
                    {course.difficultyLevel}
                  </Badge>
                )}
              </div>
              {course.description && (
                <p className="text-muted-foreground">{course.description}</p>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <UserIcon className="size-4" />
                <span>Instructor: {course.userId}</span>
              </div>
            </div>

            {/* curriculum */}
            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold">Curriculum</h2>
              {course.chapters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No content yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {course.chapters.map((chapter, ci) => (
                    <div key={chapter._id} className="rounded-lg border">
                      {/* chapter header */}
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-t-lg">
                        <span className="font-medium text-sm">
                          Chapter {ci + 1}: {chapter.title}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {chapter.lessons.length} lesson
                          {chapter.lessons.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* lessons */}
                      <div className="flex flex-col divide-y">
                        {chapter.lessons.map((lesson, li) => (
                          <div
                            key={lesson._id}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                              isEnrolled
                                ? "cursor-pointer hover:bg-muted/50"
                                : "text-muted-foreground"
                            }`}
                            onClick={() => {
                              if (isEnrolled) {
                                router.push(
                                  `/student/courses/${courseId}/lessons/${lesson._id}`
                                )
                              }
                            }}
                          >
                            {isEnrolled ? (
                              <ChevronRightIcon className="size-3.5 shrink-0" />
                            ) : (
                              <LockIcon className="size-3.5 shrink-0" />
                            )}
                            <span>
                              {li + 1}. {lesson.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* right — enroll card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-lg border p-6 flex flex-col gap-4">
              <h3 className="font-semibold text-lg">
                {isEnrolled ? "You are enrolled" : "Enroll in this course"}
              </h3>

              {isEnrolled ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircleIcon className="size-4" />
                    <span>Active enrollment</span>
                  </div>
                  <Button
                    onClick={() =>
                      router.push(`/student/dashboard`)
                    }
                    variant="outline"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    Enroll to access all lessons and track your progress.
                  </p>
                  <Button
                    onClick={handleEnroll}
                    disabled={enrolling || enrollment === undefined}
                  >
                    {enrolling ? "Enrolling..." : "Enroll Now"}
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}