"use client"

// React hooks for state and effects
import { useMemo, useState } from "react"
// Convex hooks for database mutations
import { useMutation } from "convex/react"
// Next.js navigation for redirects
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
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

// Allowed difficulty levels for courses
type DifficultyLevel = "beginner" | "intermediate" | "advanced"

// Props passed to the edit form component with initial course data
type CourseEditFormProps = {
  courseId: string
  initialTitle: string
  initialDescription?: string
  initialDifficultyLevel?: DifficultyLevel
  initialSlug?: string
  initialThumbnailUrl?: string
}

// Convert a course title into a URL-friendly slug
// e.g., "Introduction to Python" → "introduction-to-python"
function slugifyTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens into one
}

export function CourseEditForm({
  courseId,
  initialTitle,
  initialDescription,
  initialDifficultyLevel,
  initialSlug,
  initialThumbnailUrl,
}: CourseEditFormProps) {
  const router = useRouter()
  const updateCourse = useMutation(api.courses.mutations.updateCourse)

  // Form field states — initialized with existing course data
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription || "")
  const [difficultyLevel, setDifficultyLevel] = useState<"" | DifficultyLevel>(
    initialDifficultyLevel || ""
  )
  const [slug, setSlug] = useState(initialSlug || "")
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnailUrl || "")
  
  // UI state for form submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Auto-generate slug from title if the user hasn't entered one
  // Recalculated whenever title changes
  const suggestedSlug = useMemo(() => slugifyTitle(title), [title])

  // Handle form submission — validates and sends update to backend
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      // Call Convex mutation to update course in database
      await updateCourse({
        courseId: courseId as any, // Convex type system
        title: title.trim(),
        description: description.trim() || undefined,
        difficultyLevel: difficultyLevel || undefined,
        slug: slug.trim() || suggestedSlug || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
      })

      // Show success feedback, then redirect after 1 second
      setSuccess("Course updated successfully!")
      setTimeout(() => {
        router.push("/teacher/dashboard")
      }, 1000)
    } catch (err) {
      // Display error message if update fails
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
          {/* Error message alert */}
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {/* Success message alert */}
          {success ? (
            <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </p>
          ) : null}

          {/* Course title — required field */}
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

          {/* Course description — optional multi-line text */}
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

          {/* Difficulty level and slug — two-column layout on larger screens */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Difficulty Level dropdown */}
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

            {/* URL slug — auto-generated from title if left blank */}
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

          {/* Course thumbnail image URL */}
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

          {/* Action buttons — Save and Cancel */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/teacher/dashboard")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
