"use client"
import { useMemo, useState } from "react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type DifficultyLevel = "beginner" | "intermediate" | "advanced"

type CourseEditFormProps = {
  courseId: Id<"courses">
  initialData: {
    title?: string
    description?: string
    difficultyLevel?: string | undefined
    slug?: string
    thumbnailUrl?: string
  }
}

function slugifyTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function CourseEditForm({ courseId, initialData }: CourseEditFormProps) {
  const router = useRouter()
  const updateCourse = useMutation(api.courses.mutations.updateCourse)

  const [title, setTitle] = useState(initialData.title || "")
  const [description, setDescription] = useState(initialData.description || "")
  const [difficultyLevel, setDifficultyLevel] = useState<"" | DifficultyLevel>(
    initialData.difficultyLevel === "beginner" ||
    initialData.difficultyLevel === "intermediate" ||
    initialData.difficultyLevel === "advanced"
      ? initialData.difficultyLevel
      : ""
  )
  const [slug, setSlug] = useState(initialData.slug || "")
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData.thumbnailUrl || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const suggestedSlug = useMemo(() => slugifyTitle(title), [title])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      await updateCourse({
        courseId,
        title: title.trim(),
        description: description.trim() || undefined,
        difficultyLevel: difficultyLevel || undefined,
        slug: slug.trim() || suggestedSlug || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
      })

      setSuccess("Course updated successfully!")
      setTimeout(() => {
        router.push("/teacher/dashboard")
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update course")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-muted/60 shadow-sm">
      <CardHeader>
        <CardTitle>Edit course details</CardTitle>
        <CardDescription>
          Update your course information. Changes are saved immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Python"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your course..."
              rows={4}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={difficultyLevel || "none"}
                onValueChange={(value) =>
                  setDifficultyLevel(value === "none" ? "" : (value as DifficultyLevel))
                }
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select level..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={suggestedSlug || "auto-generated"}
              />
              {slug === "" && suggestedSlug ? (
                <p className="text-xs text-muted-foreground">Will use: {suggestedSlug}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail URL</Label>
            <Input
              id="thumbnail"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              type="url"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/teacher/dashboard")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
