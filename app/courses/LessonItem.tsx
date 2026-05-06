"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Trash2Icon, FileTextIcon } from "lucide-react"
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

interface Lesson {
  _id: Id<"lessons">
  title: string
  index: number
}

export function LessonItem({ lesson }: { lesson: Lesson }) {
  const deleteLesson = useMutation(api.lessons.mutations.deleteLesson)

  async function handleDelete() {
    try {
      await deleteLesson({ lessonId: lesson._id })
      toast.success("Lesson deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete lesson")
    }
  }

  return (
    <div className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50">
      <div className="flex items-center gap-2 text-sm">
        <FileTextIcon className="size-3.5 text-muted-foreground" />
        <span>{lesson.title}</span>
      </div>
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
  )
}