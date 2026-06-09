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

function slugifyTitle(value: string) {
  return value
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function CourseCreateForm() {
  const router = useRouter()
  const createCourse = useMutation(api.courses.mutations.createCourse)
  const categories = useQuery(api.courses.queries.getCategories)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState<"" | DifficultyLevel>("")
  const [slug, setSlug] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<Id<"categories">[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const suggestedSlug = useMemo(() => slugifyTitle(title), [title])

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
    setIsSubmitting(true)
    try {
      const courseId = await createCourse({
        title: title.trim(),
        description: description.trim() || undefined,
        difficultyLevel: difficultyLevel || undefined,
        slug: slug.trim() || suggestedSlug || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      })
      router.push(`/teacher/courses`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-muted/60 shadow-sm">
      <CardHeader>
        <CardTitle>Course details</CardTitle>
        <CardDescription>
          Keep the first pass simple. The backend will save this as draft.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

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
              placeholder="Short course summary (optional)"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={difficultyLevel}
                onValueChange={(v) => setDifficultyLevel(v as "" | DifficultyLevel)}
              >
                <SelectTrigger id="difficulty" className="w-full">
                  <SelectValue placeholder="Choose difficulty (optional)" />
                </SelectTrigger>
                <SelectContent>
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
                placeholder={suggestedSlug || "auto-generated-from-title"}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate from title.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <Input
              id="thumbnailUrl"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="Optional for now (file upload comes later)"
            />
          </div>

          {/* categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            {categories === undefined ? (
              <p className="text-xs text-muted-foreground">Loading categories...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((cat) => (
                  <div key={cat._id} className="flex items-center gap-2">
                    <Checkbox
                      id={cat._id}
                      checked={selectedCategories.includes(cat._id)}
                      onCheckedChange={() => toggleCategory(cat._id)}
                    />
                    <label
                      htmlFor={cat._id}
                      className="text-sm cursor-pointer"
                    >
                      {cat.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/teacher/courses")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}