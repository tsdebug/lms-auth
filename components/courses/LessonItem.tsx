"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trash2Icon, FileTextIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { QuizBuilder } from "@/components/quiz/QuizBuilder"

interface Lesson {
  _id: Id<"lessons">
  title: string
  description?: string
  index: number
}

interface LessonItemProps {
  lesson: Lesson
  courseId: Id<"courses">
}

export function LessonItem({ lesson, courseId }: LessonItemProps) {
  const router = useRouter()
  const deleteLesson = useMutation(api.lessons.mutations.deleteLesson)
  const updateLesson = useMutation(api.lessons.mutations.updateLesson)

  // expanded state — clicking lesson toggles description editor
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState(lesson.title)
  const [description, setDescription] = useState(lesson.description ?? "")
  const [saving, setSaving] = useState(false)

  async function handleDelete() {
    try {
      await deleteLesson({ lessonId: lesson._id })
      toast.success("Lesson deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete lesson")
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateLesson({
        lessonId: lesson._id,
        title: title.trim() || lesson.title,
        description: description.trim() || undefined,
      })
      toast.success("Lesson updated")
      setExpanded(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update lesson")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-md border bg-background">
      {/* lesson header row */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50 rounded-t-md"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="flex items-center gap-2 text-sm flex-1 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/teacher/courses/${courseId}/lessons/${lesson._id}`)
          }}
        >
          <FileTextIcon className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium hover:underline">{lesson.title}</span>
          {!expanded && lesson.description && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              — {lesson.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? <ChevronUpIcon className="size-3.5" />
              : <ChevronDownIcon className="size-3.5" />
            }
          </Button>

          {/* delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-destructive"
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* expanded editor */}
      {expanded && (
        <div className="flex flex-col gap-3 border-t px-3 py-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn in this lesson?"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setExpanded(false)
                setTitle(lesson.title)
                setDescription(lesson.description ?? "")
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          <div className="border-t pt-3">
            <QuizBuilder lessonId={lesson._id} />
          </div>
        </div>
      )}
    </div>
  )
}