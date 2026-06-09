"use client"

// AssignmentSubmission — student-facing assignment UI
// LIVES IN: components/assignments/AssignmentSubmission.tsx
// USED BY: app/student/courses/[courseId]/lessons/[lessonId]/page.tsx

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircleIcon, ClockIcon } from "lucide-react"
import { toast } from "sonner"
import { RichTextEditor } from "@/components/editor/RichTextEditor"

interface AssignmentSubmissionProps {
  assignmentId: Id<"assignments">
  courseId: Id<"courses">
}

export function AssignmentSubmission({
  assignmentId,
  courseId,
}: AssignmentSubmissionProps) {
  const assignment = useQuery(api.assignments.queries.getAssignmentById, {
    assignmentId,
    courseId,
  })

  const mySubmission = useQuery(api.assignments.queries.getMySubmission, {
    assignmentId,
  })

  const submitAssignment = useMutation(api.assignments.mutations.submitAssignment)

  const [textSubmission, setTextSubmission] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (assignment === undefined || mySubmission === undefined) {
    return <p className="text-sm text-muted-foreground">Loading assignment...</p>
  }

  if (assignment === null) {
    return null
  }

  // compare date only — ignore time
  // WHY: "2026-06-07" parses as midnight UTC so same-day due dates can
  // appear past due depending on timezone.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(assignment.dueDate)
  due.setHours(0, 0, 0, 0)
  const isPastDue = due < today

  const alreadySubmitted = mySubmission !== null
  const canSubmit = !isPastDue || assignment.allowLateSubmission || alreadySubmitted
  const showForm = canSubmit && (!alreadySubmitted || assignment.allowResubmission)

  async function handleSubmit() {
    if (!textSubmission.trim() && !linkUrl.trim()) {
      toast.error("Add text, a link, or both")
      return
    }

    setSubmitting(true)
    try {
      await submitAssignment({
        assignmentId,
        textSubmission: textSubmission.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
      })
      toast.success(alreadySubmitted ? "Resubmitted" : "Submitted")
      setTextSubmission("")
      setLinkUrl("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{assignment.title}</h3>
          {assignment.description && (
            <RichTextEditor
              value={assignment.description}
              onChange={() => {}}
              editable={false}
            />
          )}
        </div>

        {mySubmission?.status === "graded" && (
          <Badge className="bg-green-100 text-green-700 border-0">
            <CheckCircleIcon className="mr-1 size-3.5" />
            Graded
          </Badge>
        )}
        {mySubmission?.status === "submitted" && (
          <Badge variant="outline">Submitted</Badge>
        )}
        {mySubmission?.status === "resubmitted" && (
          <Badge variant="outline">Resubmitted</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="size-3.5" />
          Due: {assignment.dueDate}{isPastDue ? " · past due" : ""}
        </span>
        <span>Max score: {assignment.maxScore}</span>
        {assignment.allowResubmission && <span>Resubmission allowed</span>}
      </div>

      {mySubmission?.status === "graded" && (
        <div className="rounded-md border bg-muted/40 p-3 space-y-2">
          <p className="text-sm font-medium">
            Score: {mySubmission.score} / {assignment.maxScore}
          </p>
          {mySubmission.feedback && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {mySubmission.feedback}
            </p>
          )}
        </div>
      )}

      {alreadySubmitted && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Your submission
            {mySubmission.attemptNumber > 1 && ` · attempt ${mySubmission.attemptNumber}`}
          </h4>

          {mySubmission.textSubmission && (
            <RichTextEditor
              value={mySubmission.textSubmission}
              onChange={() => {}}
              editable={false}
            />
          )}

          {mySubmission.linkUrl && (
            <a
              href={mySubmission.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              {mySubmission.linkUrl}
            </a>
          )}
        </div>
      )}

      {showForm && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-medium">
            {alreadySubmitted ? "Submit a new attempt" : "Your submission"}
          </h4>

          <div className="space-y-1.5">
            <Label htmlFor="assignment-text">Write your answer</Label>
            <RichTextEditor
              value={textSubmission}
              onChange={setTextSubmission}
              placeholder="Type your answer here..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assignment-link">Or add a link</Label>
            <Input
              id="assignment-link"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://github.com/your-repo"
            />
            <p className="text-xs text-muted-foreground">
              Submit text, a link, or both.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setTextSubmission("")
                setLinkUrl("")
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Submitting..."
                : alreadySubmitted
                ? "Resubmit"
                : "Submit Assignment"}
            </Button>
          </div>
        </div>
      )}

      {isPastDue && !assignment.allowLateSubmission && !alreadySubmitted && (
        <p className="text-sm text-muted-foreground">
          Due date has passed and late submissions are not allowed.
        </p>
      )}

      {alreadySubmitted && !assignment.allowResubmission && (
        <p className="text-sm text-muted-foreground">
          Resubmission is not allowed for this assignment.
        </p>
      )}
    </div>
  )
}