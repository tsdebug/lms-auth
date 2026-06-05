"use client"

// teacher picks course → then chapter or lesson → fills quiz details
// WHY THIS FLOW: quiz needs to be anchored before you can fill details
// same pattern as creating a course then adding chapters

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function NewQuizPage() {
  const router = useRouter()

  // step 1 — pick course
  const courses = useQuery(api.courses.queries.getCoursesByTeacher)

  const [selectedCourseId, setSelectedCourseId] =
    useState<Id<"courses"> | null>(null)

  // step 2 — pick chapter or lesson within chosen course
  // getCourseContent gives us chapters with lessons nested inside
  const courseContent = useQuery(
    api.chapters.queries.getCourseContent,
    selectedCourseId ? { courseId: selectedCourseId } : "skip"
  )

  // attachTo: "lesson" or "chapter"
  const [attachTo, setAttachTo] = useState<"lesson" | "chapter">("lesson")
  const [selectedLessonId, setSelectedLessonId] =
    useState<Id<"lessons"> | null>(null)
  const [selectedChapterId, setSelectedChapterId] =
    useState<Id<"chapters"> | null>(null)

  // quiz details
  const [title, setTitle] = useState("")
  const [totalScore, setTotalScore] = useState("100")
  const [creating, setCreating] = useState(false)

  const createQuiz = useMutation(api.quizzes.mutations.createQuiz)

  async function handleCreate() {
    if (!title.trim()) return toast.error("Title is required")
    if (attachTo === "lesson" && !selectedLessonId)
      return toast.error("Pick a lesson")
    if (attachTo === "chapter" && !selectedChapterId)
      return toast.error("Pick a chapter")

    setCreating(true)
    try {
      const quizId = await createQuiz({
        title: title.trim(),
        description: "",
        totalScore: Number(totalScore),
        lessonId: attachTo === "lesson" ? selectedLessonId! : undefined,
        chapterId: attachTo === "chapter" ? selectedChapterId! : undefined,
      })
      toast.success("Quiz created")
      // go straight to the quiz editor to add questions
      router.push(`/teacher/quizzes/${quizId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setCreating(false)
    }
  }

  return (
    <SidebarProvider style={{
      "--sidebar-width": "calc(var(--spacing) * 72)",
      "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-xl">
          <div>
            <h1 className="text-2xl font-semibold">New Quiz</h1>
            <p className="text-sm text-muted-foreground">
              Pick where this quiz lives, then add questions after.
            </p>
          </div>

          {/* step 1 — pick course */}
          <div className="flex flex-col gap-1.5">
            <Label>Course</Label>
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={selectedCourseId ?? ""}
              onChange={(e) => {
                setSelectedCourseId(e.target.value as Id<"courses">)
                setSelectedLessonId(null)
                setSelectedChapterId(null)
              }}
            >
              <option value="">Select a course</option>
              {courses?.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* step 2 — lesson or chapter toggle */}
          {selectedCourseId && courseContent && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Attach to</Label>
                <div className="flex gap-2">
                  {["lesson", "chapter"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setAttachTo(opt as "lesson" | "chapter")
                        setSelectedLessonId(null)
                        setSelectedChapterId(null)
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs border transition-colors capitalize ${
                        attachTo === opt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* lesson picker — grouped by chapter */}
              {attachTo === "lesson" && (
                <div className="flex flex-col gap-1.5">
                  <Label>Lesson</Label>
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={selectedLessonId ?? ""}
                    onChange={(e) =>
                      setSelectedLessonId(e.target.value as Id<"lessons">)
                    }
                  >
                    <option value="">Select a lesson</option>
                    {courseContent.chapters.map((chapter: any) => (
                      <optgroup key={chapter._id} label={chapter.title}>
                        {chapter.lessons.map((lesson: any) => (
                          <option key={lesson._id} value={lesson._id}>
                            {lesson.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {/* chapter picker */}
              {attachTo === "chapter" && (
                <div className="flex flex-col gap-1.5">
                  <Label>Chapter</Label>
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={selectedChapterId ?? ""}
                    onChange={(e) =>
                      setSelectedChapterId(e.target.value as Id<"chapters">)
                    }
                  >
                    <option value="">Select a chapter</option>
                    {courseContent.chapters.map((chapter: any) => (
                      <option key={chapter._id} value={chapter._id}>
                        {chapter.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* quiz details */}
          <div className="flex flex-col gap-1.5">
            <Label>Quiz title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1 Review"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Total score</Label>
            <Input
              type="number"
              value={totalScore}
              onChange={(e) => setTotalScore(e.target.value)}
              className="w-32"
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={creating || !title.trim() || !selectedCourseId}
            className="w-fit"
          >
            {creating ? "Creating..." : "Create & Add Questions"}
          </Button>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}