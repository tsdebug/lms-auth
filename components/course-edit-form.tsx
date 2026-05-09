"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

type DifficultyLevel = "beginner" | "intermediate" | "advanced"

type CourseEditFormProps = {
  courseId: Id<"courses">
  initialData: {
    title?: string
    description?: string
    difficultyLevel?: string | undefined
    slug?: string
    thumbnailUrl?: string
    categoryIds?: Id<"categories">[]  // ← added: pre-selected categories
  }
}

function slugifyTitle(value: string) {
  return value
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function CourseEditForm({ courseId, initialData }: CourseEditFormProps) {
  const router = useRouter()
  const updateCourse = useMutation(api.courses.mutations.updateCourse)

  // fetch all available categories for the checkbox list
  const categories = useQuery(api.courses.queries.getCategories)

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

  // pre-fill with categories already linked to this course
  const [selectedCategories, setSelectedCategories] = useState<Id<"categories">[]>(
    initialData.categoryIds ?? []
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const suggestedSlug = useMemo(() => slugifyTitle(title), [title])

  // toggle a category in/out of the selected array
  // if already selected → remove it
  // if not selected → add it
  function toggleCategory(id: Id<"categories">) {
    setSelectedCategories((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        // pass selected category IDs — mutation will replace existing ones
        categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      })

      setSuccess("Course updated successfully!")
      // brief delay so user sees the success message before redirect
      setTimeout(() => {
        router.push("/teacher/courses")
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

          {/* error message */}
          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* success message */}
          {success && (
            <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </p>
          )}

          {/* title — required */}
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

          {/* description — optional */}
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
            {/* difficulty — optional */}
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

            {/* slug — auto-generated from title if left empty */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={suggestedSlug || "auto-generated"}
              />
              {slug === "" && suggestedSlug && (
                <p className="text-xs text-muted-foreground">
                  Will use: {suggestedSlug}
                </p>
              )}
            </div>
          </div>

          {/* thumbnail url — file upload comes later with R2 */}
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

          {/* categories — checkboxes from database */}
          <div className="space-y-2">
            <Label>Categories</Label>
            {categories === undefined ? (
              // loading state while query is in flight
              <p className="text-xs text-muted-foreground">Loading categories...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((cat) => (
                  <div key={cat._id} className="flex items-center gap-2">
                    <Checkbox
                      id={`cat-${cat._id}`}
                      // checked if this category is in selectedCategories array
                      checked={selectedCategories.includes(cat._id)}
                      onCheckedChange={() => toggleCategory(cat._id)}
                    />
                    <label
                      htmlFor={`cat-${cat._id}`}
                      className="text-sm cursor-pointer"
                    >
                      {cat.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/teacher/courses")}
            >
              Cancel
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}