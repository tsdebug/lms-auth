"use client"

// AssignmentBuilder — teacher-facing assignment creation UI
// LIVES IN: components/assignments/AssignmentBuilder.tsx
// USED BY: app/teacher/courses/[courseId]/lessons/[lessonId]/page.tsx
//
// WHAT IT DOES:
//   - lets teacher create an assignment attached to this lesson OR its chapter
//   - shows existing assignment if one already exists
//   - lets teacher edit title, description, due date, max score, and submission rules
//
// WHY THIS PATTERN:
//   same pattern as QuizBuilder — component owns all its state,
//   page file stays clean, reusable if needed elsewhere
//
// DATA FLOW:
//   lessonId + chapterId → getAssignmentsByLesson query → existing assignment
//   mutations: createAssignment, updateAssignment

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RichTextEditor } from "@/components/editor/RichTextEditor"
import { PencilIcon } from "lucide-react"
import { toast } from "sonner"

interface AssignmentBuilderProps {
  lessonId: Id<"lessons">
  chapterId: Id<"chapters">  // needed so teacher can optionally attach to chapter
  courseId: Id<"courses">    // needed for the getAssignmentsByLesson query
}

export function AssignmentBuilder({
  lessonId,
  chapterId,
  courseId,
}: AssignmentBuilderProps) {

  // --- fetch existing assignment for this lesson ---
  // WHY: we want to show the existing assignment if one already exists
  // so teacher can edit it rather than create a duplicate
  // getAssignmentsByLesson returns an array — a lesson can theoretically
  // have multiple assignments, but we show the first one for now
  const assignments = useQuery(api.assignments.queries.getAssignmentsByLesson, {
    lessonId,
    courseId,
  })

  const createAssignment = useMutation(api.assignments.mutations.createAssignment)
  const updateAssignment = useMutation(api.assignments.mutations.updateAssignment)

  // --- form state for CREATING a new assignment ---
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [maxScore, setMaxScore] = useState("100")
  const [allowLate, setAllowLate] = useState(false)
  const [allowResub, setAllowResub] = useState(false)
  // WHO IS THIS FOR: lesson (default) or chapter?
  // WHY DEFAULT TO LESSON: teacher is already on the lesson editor,
  // so attaching to this lesson is the common case — zero friction
  const [attachTo, setAttachTo] = useState<"lesson" | "chapter">("lesson")
  const [creating, setCreating] = useState(false)

  // --- state for EDITING an existing assignment ---
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDueDate, setEditDueDate] = useState("")
  const [editMaxScore, setEditMaxScore] = useState("")
  const [editAllowLate, setEditAllowLate] = useState(false)
  const [editAllowResub, setEditAllowResub] = useState(false)
  const [saving, setSaving] = useState(false)

  // loading state — query hasn't resolved yet
  if (assignments === undefined) {
    return <div className="text-sm text-muted-foreground">Loading assignment...</div>
  }

  // grab the first assignment if one exists
  // WHY: we treat one assignment per lesson as the standard case
  const existing = assignments[0] ?? null

  // --- HANDLER: create new assignment ---
  async function handleCreate() {
    if (!title.trim() || !dueDate) {
      toast.error("Title and due date are required")
      return
    }
    setCreating(true)
    try {
      await createAssignment({
        title: title.trim(),
        description: description.trim() || undefined,
        // attach to lesson or chapter based on teacher's choice
        // WHY BOTH ARE OPTIONAL IN THE MUTATION: schema allows either,
        // but at least one must be present — the mutation enforces this
        lessonId: attachTo === "lesson" ? lessonId : undefined,
        chapterId: attachTo === "chapter" ? chapterId : undefined,
        dueDate,
        maxScore: Number(maxScore),
        allowLateSubmission: allowLate,
        allowResubmission: allowResub,
      })
      toast.success("Assignment created")
      // reset form
      setTitle("")
      setDescription("")
      setDueDate("")
      setMaxScore("100")
      setAllowLate(false)
      setAllowResub(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create")
    } finally {
      setCreating(false)
    }
  }

  // --- HANDLER: save edited assignment ---
  async function handleSave() {
    if (!existing) return
    setSaving(true)
    try {
      await updateAssignment({
        assignmentId: existing._id,
        title: editTitle.trim() || undefined,
        description: editDescription.trim() || undefined,
        dueDate: editDueDate || undefined,
        maxScore: Number(editMaxScore),
        allowLateSubmission: editAllowLate,
        allowResubmission: editAllowResub,
      })
      toast.success("Assignment updated")
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  // --- RENDER: no assignment yet — show create form ---
  if (!existing) {
    return (
      <div className="rounded-lg border p-4 flex flex-col gap-4">
        <h3 className="font-medium text-sm">Create an Assignment</h3>

        {/* attach to: lesson or chapter toggle */}
        {/* WHY SHOW THIS: teacher might want a chapter-level assignment
            (covers all lessons in the chapter) vs a lesson-specific one */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Attach to</Label>
          <div className="flex gap-2">
            <button
              onClick={() => setAttachTo("lesson")}
              className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                attachTo === "lesson"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-foreground"
              }`}
            >
              This lesson
            </button>
            <button
              onClick={() => setAttachTo("chapter")}
              className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                attachTo === "chapter"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-foreground"
              }`}
            >
              This chapter
            </button>
          </div>
          {/* explain what this choice means so teacher isn't confused */}
          <p className="text-xs text-muted-foreground">
            {attachTo === "lesson"
              ? "Students will see this assignment inside this lesson."
              : "Students will see this assignment after completing all lessons in this chapter."}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build a to-do app"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Description</Label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="What should students build or submit?"
          />
        </div>

        {/* due date + max score side by side */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label className="text-xs">Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 w-28">
            <Label className="text-xs">Max score</Label>
            <Input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
            />
          </div>
        </div>

        {/* submission rules — checkboxes */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs">Submission rules</Label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={allowLate}
              onChange={(e) => setAllowLate(e.target.checked)}
              className="cursor-pointer"
            />
            Allow late submission
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={allowResub}
              onChange={(e) => setAllowResub(e.target.checked)}
              className="cursor-pointer"
            />
            Allow resubmission
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setTitle("")
              setDescription("")
              setDueDate("")
              setMaxScore("100")
              setAllowLate(false)
              setAllowResub(false)
              setAttachTo("lesson")
            }}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={creating || !title.trim() || !dueDate}
          >
            {creating ? "Creating..." : "Create Assignment"}
          </Button>
        </div>
      </div>
    )
  }

  // --- RENDER: assignment exists — show it, with edit mode ---
  return (
    <div className="rounded-lg border p-4 flex flex-col gap-4">

      {editing ? (
        // EDIT MODE — same fields as create form but pre-filled
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Description</Label>
            <RichTextEditor
              value={editDescription}
              onChange={setEditDescription}
              placeholder="Assignment instructions..."
            />
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label className="text-xs">Due date</Label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 w-28">
              <Label className="text-xs">Max score</Label>
              <Input
                type="number"
                value={editMaxScore}
                onChange={(e) => setEditMaxScore(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs">Submission rules</Label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editAllowLate}
                onChange={(e) => setEditAllowLate(e.target.checked)}
              />
              Allow late submission
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editAllowResub}
                onChange={(e) => setEditAllowResub(e.target.checked)}
              />
              Allow resubmission
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        // VIEW MODE — show assignment details cleanly
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{existing.title}</h3>
                {/* badge shows whether this is lesson or chapter level */}
                <Badge variant="outline" className="text-xs">
                  {existing.lessonId ? "Lesson assignment" : "Chapter assignment"}
                </Badge>
              </div>
              {existing.description && (
                <RichTextEditor
                  value={existing.description}
                  onChange={() => {}}
                  editable={false}
                />
              )}
            </div>
            {/* edit button — pre-fills all fields when clicked */}
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={() => {
                // pre-fill edit state from existing data
                setEditTitle(existing.title)
                setEditDescription(existing.description ?? "")
                setEditDueDate(existing.dueDate)
                setEditMaxScore(String(existing.maxScore))
                setEditAllowLate(existing.allowLateSubmission)
                setEditAllowResub(existing.allowResubmission)
                setEditing(true)
              }}
            >
              <PencilIcon className="size-3.5" />
            </Button>
          </div>

          {/* assignment meta */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Due: {existing.dueDate}</span>
            <span>Max score: {existing.maxScore}</span>
            <span>{existing.allowLateSubmission ? "Late allowed" : "No late submission"}</span>
            <span>{existing.allowResubmission ? "Resubmission allowed" : "No resubmission"}</span>
          </div>
        </>
      )}
    </div>
  )
}