"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type DifficultyLevel = "beginner" | "intermediate" | "advanced"

type CourseEditFormProps = {
  courseId: Id<"courses">
  initialData: {
    title?: string
    description?: string
    difficultyLevel?: string | undefined
    slug?: string
    thumbnailUrl?: string
    categoryIds?: Id<"categories">[]
  }
  // called after a successful save, or after a confirmed cancel —
  // parent uses this to collapse the accordion back
  onDone?: () => void
}

function slugifyTitle(value: string) {
  return value
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

const normalizedDifficulty = (
  d: string | undefined
): "" | DifficultyLevel =>
  d === "beginner" || d === "intermediate" || d === "advanced" ? d : ""

export function CourseEditForm({ courseId, initialData, onDone }: CourseEditFormProps) {
  const updateCourse = useMutation(api.courses.mutations.updateCourse)
  const categories = useQuery(api.courses.queries.getCategories)

  const initialTitle = initialData.title || ""
  const initialDescription = initialData.description || ""
  const initialDifficulty = normalizedDifficulty(initialData.difficultyLevel)
  const initialSlug = initialData.slug || ""
  const initialThumbnailUrl = initialData.thumbnailUrl || ""
  const initialCategoryIds = initialData.categoryIds ?? []

  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [difficultyLevel, setDifficultyLevel] = useState<"" | DifficultyLevel>(initialDifficulty)
  const [slug, setSlug] = useState(initialSlug)
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnailUrl)
  const [selectedCategories, setSelectedCategories] = useState<Id<"categories">[]>(initialCategoryIds)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const suggestedSlug = useMemo(() => slugifyTitle(title), [title])

  // dirty check — did anything actually change from what was loaded?
  const isDirty = useMemo(() => {
    const sameCategories =
      selectedCategories.length === initialCategoryIds.length &&
      selectedCategories.every((id) => initialCategoryIds.includes(id))

    return (
      title !== initialTitle ||
      description !== initialDescription ||
      difficultyLevel !== initialDifficulty ||
      slug !== initialSlug ||
      thumbnailUrl !== initialThumbnailUrl ||
      !sameCategories
    )
  }, [
    title, description, difficultyLevel, slug, thumbnailUrl, selectedCategories,
    initialTitle, initialDescription, initialDifficulty, initialSlug,
    initialThumbnailUrl, initialCategoryIds,
  ])

  function toggleCategory(id: Id<"categories">) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  function resetToInitial() {
    setTitle(initialTitle)
    setDescription(initialDescription)
    setDifficultyLevel(initialDifficulty)
    setSlug(initialSlug)
    setThumbnailUrl(initialThumbnailUrl)
    setSelectedCategories(initialCategoryIds)
    setError("")
  }

  function handleCancelClick() {
    if (!isDirty) {
      // nothing changed — nothing to confirm, just collapse
      onDone?.()
      return
    }
    setShowCancelConfirm(true)
  }

  function confirmDiscard() {
    resetToInitial()
    setShowCancelConfirm(false)
    onDone?.()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    try {
      await updateCourse({
        courseId,
        title: title.trim(),
        description: description.trim() || undefined,
        difficultyLevel: difficultyLevel || undefined,
        slug: slug.trim() || suggestedSlug || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      })
      onDone?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update course")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
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
            {slug === "" && suggestedSlug && (
              <p className="text-xs text-muted-foreground">Will use: {suggestedSlug}</p>
            )}
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

        <div className="space-y-2">
          <Label>Categories</Label>
          {categories === undefined ? (
            <p className="text-xs text-muted-foreground">Loading categories...</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((cat) => (
                <div key={cat._id} className="flex items-center gap-2">
                  <Checkbox
                    id={`cat-${cat._id}`}
                    checked={selectedCategories.includes(cat._id)}
                    onCheckedChange={() => toggleCategory(cat._id)}
                  />
                  <label htmlFor={`cat-${cat._id}`} className="text-sm cursor-pointer">
                    {cat.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleCancelClick}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !title.trim() || !isDirty}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You've edited the course details but haven't saved. If you continue,
              these edits will be discarded and reverted back to their last saved values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}