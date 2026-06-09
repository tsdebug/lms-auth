"use client"

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
import { RichTextEditor } from "@/components/editor/RichTextEditor"

export default function NewAssignmentPage() {
  const router = useRouter()
  const courses = useQuery(api.courses.queries.getCoursesByTeacher)

  const [selectedCourseId, setSelectedCourseId] = useState<Id<"courses"> | null>(null)
  const courseContent = useQuery(
    api.chapters.queries.getCourseContent,
    selectedCourseId ? { courseId: selectedCourseId } : "skip"
  )

  const [attachTo, setAttachTo] = useState<"lesson" | "chapter">("lesson")
  const [selectedLessonId, setSelectedLessonId] = useState<Id<"lessons"> | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<Id<"chapters"> | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [maxScore, setMaxScore] = useState("100")
  const [allowLate, setAllowLate] = useState(false)
  const [allowResub, setAllowResub] = useState(false)
  const [creating, setCreating] = useState(false)

  const createAssignment = useMutation(api.assignments.mutations.createAssignment)

  async function handleCreate() {
    if (!title.trim() || !dueDate) return toast.error("Title and due date required")
    if (attachTo === "lesson" && !selectedLessonId) return toast.error("Pick a lesson")
    if (attachTo === "chapter" && !selectedChapterId) return toast.error("Pick a chapter")

    setCreating(true)
    try {
      const id = await createAssignment({
        title: title.trim(),
        description: description.trim() || undefined,
        lessonId: attachTo === "lesson" ? selectedLessonId! : undefined,
        chapterId: attachTo === "chapter" ? selectedChapterId! : undefined,
        dueDate,
        maxScore: Number(maxScore),
        allowLateSubmission: allowLate,
        allowResubmission: allowResub,
      })
      toast.success("Assignment created")
      router.push(`/teacher/assignments/${id}`)
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
            <h1 className="text-2xl font-semibold">New Assignment</h1>
            <p className="text-sm text-muted-foreground">
              Pick where this assignment lives first.
            </p>
          </div>

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
                      className={`px-3 py-1.5 rounded-md text-xs border capitalize transition-colors ${
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

              {attachTo === "lesson" && (
                <div className="flex flex-col gap-1.5">
                  <Label>Lesson</Label>
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={selectedLessonId ?? ""}
                    onChange={(e) => setSelectedLessonId(e.target.value as Id<"lessons">)}
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

              {attachTo === "chapter" && (
                <div className="flex flex-col gap-1.5">
                  <Label>Chapter</Label>
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={selectedChapterId ?? ""}
                    onChange={(e) => setSelectedChapterId(e.target.value as Id<"chapters">)}
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

          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build a REST API" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="What should students submit?"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 w-28">
              <Label>Max score</Label>
              <Input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Rules</Label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={allowLate} onChange={(e) => setAllowLate(e.target.checked)} />
              Allow late submission
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={allowResub} onChange={(e) => setAllowResub(e.target.checked)} />
              Allow resubmission
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/teacher/assignments")}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !title.trim() || !dueDate}
            >
              {creating ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}