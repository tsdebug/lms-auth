"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { ChapterItem } from "@/components/courses/ChapterItem"
import { toast } from "sonner"
import { useState } from "react"
import { Input } from "@/components/ui/input"

interface Chapter {
  _id: Id<"chapters">
  title: string
  index: number
  lessons: {
    _id: Id<"lessons">
    title: string
    index: number
  }[]
}

interface ChapterListProps {
  courseId: Id<"courses">
  chapters: Chapter[]
}

export function ChapterList({ courseId, chapters }: ChapterListProps) {
  const createChapter = useMutation(api.chapters.mutations.createChapter)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")

  async function handleAddChapter() {
    if (!title.trim()) return
    try {
      await createChapter({ courseId, title: title.trim() })
      toast.success("Chapter added")
      setTitle("")
      setAdding(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add chapter")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {chapters.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No chapters yet. Add your first chapter below.
        </p>
      )}

      {chapters.map((chapter) => (
        <ChapterItem key={chapter._id} chapter={chapter} />
      ))}

      {/* add chapter form */}
      {adding ? (
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chapter title"
            className="max-w-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
            autoFocus
          />
          <Button size="sm" onClick={handleAddChapter}>Add</Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setAdding(false); setTitle("") }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setAdding(true)}
        >
          <PlusIcon className="size-4 mr-1" />
          Add Chapter
        </Button>
      )}
    </div>
  )
}