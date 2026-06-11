"use client"

// Student lesson viewer
// FIXED:
//   1. now fetches BOTH lesson-level AND chapter-level quiz/assignment
//      previously chapter-level ones were invisible because we only
//      queried by lessonId — chapter items have no lessonId
//   2. resolvedQuiz and allAssignments merge both sources

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  CheckCircleIcon, CircleIcon,
  ChevronLeftIcon, ChevronRightIcon, BookOpenIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { QuizPlayer } from "@/components/quiz/QuizPlayer"
import { AssignmentSubmission } from "@/components/assignments/AssignmentSubmission"

import { RichTextEditor } from "@/components/editor/RichTextEditor"

export default function LessonViewerPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as Id<"courses">
  const lessonId = params.lessonId as Id<"lessons">

  const lesson = useQuery(api.lessons.queries.getLessonContent, { lessonId, courseId })
  const progress = useQuery(api.lessons.queries.getCourseProgressForStudent, { courseId })

  // --- quiz fetching ---
  // fetch lesson-level quiz (quiz attached to this specific lesson)
  const lessonQuiz = useQuery(
    api.quizzes.queries.getQuizForStudent,
    { lessonId, courseId }
  )
  // fetch chapter-level quiz (quiz attached to the whole chapter)
  // WHY "skip": lesson.chapterId only exists once the lesson query resolves
  // Convex "skip" tells it not to run until we have the argument
  const chapterQuiz = useQuery(
    api.quizzes.queries.getQuizByChapterForStudent,
    lesson?.chapterId
      ? { chapterId: lesson.chapterId, courseId }
      : "skip"
  )
  // use lesson quiz first, fall back to chapter quiz
  // WHY: lesson-specific quiz is more relevant to show
  const resolvedQuiz = lessonQuiz ?? chapterQuiz

  // --- assignment fetching ---
  // same pattern as quiz — fetch both lesson and chapter level
  const lessonAssignments = useQuery(
    api.assignments.queries.getAssignmentsByLesson,
    { lessonId, courseId }
  )
  const chapterAssignments = useQuery(
    api.assignments.queries.getAssignmentsByChapter,
    lesson?.chapterId
      ? { chapterId: lesson.chapterId, courseId }
      : "skip"
  )
  // merge both arrays — lesson assignments first
  const allAssignments = [
    ...(lessonAssignments ?? []),
    ...(chapterAssignments ?? []),
  ]
  // we show the first one in the expandable section
  // multiple assignments edge case can be handled later
  const assignment = allAssignments[0] ?? null

  const markComplete = useMutation(api.lessons.mutations.markLessonComplete)
  const [marking, setMarking] = useState(false)

  // activeSection: which panel is expanded — null, "quiz", or "assignment"
  // clicking the same button again collapses it (toggle behavior)
  const [activeSection, setActiveSection] = useState<"quiz" | "assignment" | null>(null)

  function toggleSection(section: "quiz" | "assignment") {
    setActiveSection((prev) => (prev === section ? null : section))
  }

  async function handleMarkComplete() {
    setMarking(true)
    try {
      const result = await markComplete({ lessonId })
      if ((result as any)?.certificateIssued) {
        toast.success("🎉 Course complete! Certificate issued.", {
          duration: 6000,
          action: {
            label: "View",
            onClick: () =>
              window.open(`/certificate/${(result as any).verificationCode}`, "_blank"),
          },
        })
      } else {
        toast.success("Lesson marked as complete!")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setMarking(false)
    }
  }

  const allLessons = progress?.chapters.flatMap((c) => c.lessons) ?? []
  const currentIndex = allLessons.findIndex((l) => l._id === lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1
    ? allLessons[currentIndex + 1]
    : null

  if (lesson === undefined || progress === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  if (lesson === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Lesson not found</p>
      </div>
    )
  }

  const hasQuiz = resolvedQuiz !== null && resolvedQuiz !== undefined
  const hasAssignment = assignment !== null

  return (
    <div className="min-h-screen bg-background flex">

      {/* sidebar */}
      <div className="hidden lg:flex flex-col w-72 border-r shrink-0">
        <div className="p-4 border-b">
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
          >
            ← Back to course
          </button>
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookOpenIcon className="size-4" />
            <span>Course Progress</span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{progress.completedCount}/{progress.totalCount} lessons</span>
              <span>{progress.progressPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {progress.chapters.map((chapter, ci) => (
            <div key={chapter._id}>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {ci + 1}. {chapter.title}
              </div>
              {chapter.lessons.map((l, li) => (
                <button
                  key={l._id}
                  onClick={() =>
                    router.push(`/student/courses/${courseId}/lessons/${l._id}`)
                  }
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${l._id === lessonId
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/50"
                    }`}
                >
                  {l.isCompleted ? (
                    <CheckCircleIcon className="size-3.5 text-green-500 shrink-0" />
                  ) : (
                    <CircleIcon className="size-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate">{li + 1}. {l.title}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* main content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Chapter {lesson.chapterIndex + 1}: {lesson.chapterTitle}
          </div>
          {lesson.isCompleted ? (
            <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircleIcon className="size-4" />
              Completed
            </div>
          ) : (
            <Button size="sm" onClick={handleMarkComplete} disabled={marking}>
              {marking ? "Saving..." : "Mark as Complete"}
            </Button>
          )}
        </div>

        <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
          <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>

          {lesson.description ? (
            // editable=false shows content without toolbar
            // WHY RichTextEditor not dangerouslySetInnerHTML:
            // Tiptap handles the HTML rendering safely with proper prose styling
            <RichTextEditor
              value={lesson.description}
              onChange={() => { }}
              editable={false}
            />
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <BookOpenIcon className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No content yet.
              </p>
            </div>
          )}

          {/* quiz + assignment toggle buttons */}
          {(hasQuiz || hasAssignment) && (
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex gap-2">
                {hasQuiz && (
                  <button
                    onClick={() => toggleSection("quiz")}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${activeSection === "quiz"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-foreground"
                      }`}
                  >
                    Quiz
                  </button>
                )}
                {hasAssignment && (
                  <button
                    onClick={() => toggleSection("assignment")}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${activeSection === "assignment"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-foreground"
                      }`}
                  >
                    Assignment
                  </button>
                )}
              </div>

              {/* expanded panel */}
              {activeSection === "quiz" && resolvedQuiz && (
                <QuizPlayer
                  lessonId={lessonId}
                  courseId={courseId}
                  // pass chapterId if this is a chapter-level quiz
                  // QuizPlayer needs it to fetch the right quiz
                  chapterId={resolvedQuiz.chapterId ?? undefined}
                />
              )}

              {activeSection === "assignment" && assignment && (
                <AssignmentSubmission
                  assignmentId={assignment._id}
                  courseId={courseId}
                />
              )}
            </div>
          )}
        </div>

        {/* prev / next */}
        <div className="border-t px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevLesson}
            onClick={() =>
              prevLesson &&
              router.push(`/student/courses/${courseId}/lessons/${prevLesson._id}`)
            }
          >
            <ChevronLeftIcon className="size-4 mr-1" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {allLessons.length}
          </span>
          <Button
            size="sm"
            disabled={!nextLesson}
            onClick={() =>
              nextLesson &&
              router.push(`/student/courses/${courseId}/lessons/${nextLesson._id}`)
            }
          >
            Next
            <ChevronRightIcon className="size-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}