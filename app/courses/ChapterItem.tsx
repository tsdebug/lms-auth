"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { LessonItem } from "@/app/courses/LessonItem"
import { toast } from "sonner"
import { useState } from "react"
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

interface Lesson {
  _id: Id<"lessons">
  title: string
  index: number
}

interface Chapter {
  _id: Id<"chapters">
  title: string
  index: number
  lessons: Lesson[]
}

export function ChapterItem({ chapter }: { chapter: Chapter }) {
  const createLesson = useMutation(api.lessons.mutations.createLesson)
  const deleteChapter = useMutation(api.chapters.mutations.deleteChapter)
  const [addingLesson, setAddingLesson] = useState(false)
  const [lessonTitle, setLessonTitle] = useState("")

  async function handleAddLesson() {
    if (!lessonTitle.trim()) return
    try {
      await createLesson({
        chapterId: chapter._id,
        title: lessonTitle.trim(),
      })
      toast.success("Lesson added")
      setLessonTitle("")
      setAddingLesson(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add lesson")
    }
  }

  async function handleDeleteChapter() {
    try {
      await deleteChapter({ chapterId: chapter._id })
      toast.success("Chapter deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete chapter")
    }
  }

  return (
    <div className="rounded-lg border p-4 flex flex-col gap-3">
      {/* chapter header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          Chapter {chapter.index + 1}: {chapter.title}
        </h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-destructive">
              <Trash2Icon className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this chapter?</AlertDialogTitle>
              <AlertDialogDescription>
                This will also delete all lessons inside it. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteChapter}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* lessons */}
      <div className="flex flex-col gap-1 pl-4">
        {chapter.lessons.length === 0 && (
          <p className="text-xs text-muted-foreground">No lessons yet.</p>
        )}
        {chapter.lessons.map((lesson) => (
          <LessonItem key={lesson._id} lesson={lesson} />
        ))}
      </div>

      {/* add lesson */}
      {addingLesson ? (
        <div className="flex items-center gap-2 pl-4">
          <Input
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            placeholder="Lesson title"
            className="max-w-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAddLesson()}
            autoFocus
          />
          <Button size="sm" onClick={handleAddLesson}>Add</Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setAddingLesson(false); setLessonTitle("") }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-fit pl-4 text-muted-foreground"
          onClick={() => setAddingLesson(true)}
        >
          <PlusIcon className="size-4 mr-1" />
          Add Lesson
        </Button>
      )}
    </div>
  )
}