"use client"

// LessonEditorPage
// PURPOSE: dedicated page for teacher to manage one lesson
// CONTAINS:
//   - lesson title + description editing
//   - quiz builder for this lesson
// LINKED FROM: clicking a lesson in ChapterItem
// LINKS TO: back to course editor

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AssignmentBuilder } from "@/components/assignments/AssignmentBuilder"
import { RichTextEditor } from "@/components/editor/RichTextEditor"
import { QuizBuilder } from "@/components/quiz/QuizBuilder"
import { useState } from "react"
import { toast } from "sonner"
import { ArrowLeftIcon } from "lucide-react"
import { Card, CardHeader } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function LessonEditorPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as Id<"courses">
  const lessonId = params.lessonId as Id<"lessons">

  // fetch lesson content using teacher-specific query
  const lessonContent = useQuery(
    api.lessons.queries.getLessonById,
    { lessonId }
  )

  const updateLesson = useMutation(api.lessons.mutations.updateLesson)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lessonOpen, setLessonOpen] = useState<string | undefined>(undefined)
  const [quizOpen, setQuizOpen] = useState<string | undefined>(undefined)
  const [assignmentOpen, setAssignmentOpen] = useState<string | undefined>(undefined)

  // pre-fill form when data loads
  // initialized flag prevents overwriting user edits on re-render
  if (lessonContent && !initialized) {
    setTitle(lessonContent.title)
    setDescription(lessonContent.description ?? "")
    setInitialized(true)
  }

  function handleCancel() {
    if (!lessonContent) return
    setTitle(lessonContent.title)
    setDescription(lessonContent.description ?? "")
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateLesson({
        lessonId,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      })
      toast.success("Lesson saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (lessonContent === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
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
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl">

          {/* back button — returns to course editor */}
          <button
            onClick={() =>
              router.push(`/teacher/courses/${courseId}/edit`)
            }
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to course
          </button>

          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="pb-0">
              <Accordion
                type="single"
                collapsible
                value={lessonOpen}
                onValueChange={setLessonOpen}
              >
                <AccordionItem value="lesson" className="border-b-0">
                  <AccordionTrigger className="py-0 hover:no-underline">
                    <div className="flex w-full items-center justify-between gap-3">
                      <h1 className="text-2xl font-semibold">Edit Lesson</h1>
                      <span className="text-sm font-normal text-muted-foreground">
                        Edit lesson details
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label>Title</Label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Lesson title"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label>Lesson content</Label>
                        <p className="text-xs text-muted-foreground">
                          Write the material students will read when they open this lesson.
                        </p>
                        <RichTextEditor
                          value={description}
                          onChange={setDescription}
                          placeholder="Add lesson content, instructions, resources..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save Lesson"}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardHeader>
          </Card>

          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="pb-0">
              <Accordion
                type="single"
                collapsible
                value={quizOpen}
                onValueChange={setQuizOpen}
              >
                <AccordionItem value="quiz" className="border-b-0">
                  <AccordionTrigger className="py-0 hover:no-underline">
                    <div className="flex w-full items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold">Quiz</h2>
                        <p className="text-sm text-muted-foreground">
                          Add a quiz to test student understanding of this lesson.
                        </p>
                      </div>
                      <span className="text-sm font-normal text-muted-foreground">
                        Manage quiz
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <QuizBuilder
                      lessonId={lessonId}
                      chapterId={lessonContent.chapterId}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardHeader>
          </Card>

          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="pb-0">
              <Accordion
                type="single"
                collapsible
                value={assignmentOpen}
                onValueChange={setAssignmentOpen}
              >
                <AccordionItem value="assignment" className="border-b-0">
                  <AccordionTrigger className="py-0 hover:no-underline">
                    <div className="flex w-full items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold">Assignment</h2>
                        <p className="text-sm text-muted-foreground">
                          Add an assignment for students to complete as part of this lesson or chapter.
                        </p>
                      </div>
                      <span className="text-sm font-normal text-muted-foreground">
                        Manage assignment
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <AssignmentBuilder
                      lessonId={lessonId}
                      chapterId={lessonContent.chapterId}
                      courseId={courseId}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardHeader>
          </Card>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}