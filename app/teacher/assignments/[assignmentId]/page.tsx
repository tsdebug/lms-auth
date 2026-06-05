"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function AssignmentEditorPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.assignmentId as Id<"assignments">

  // we need courseId for getAssignmentById and getSubmissionsByAssignment
  // but we only have assignmentId here — add getAssignmentWithCourse query below
  const assignmentData = useQuery(
    api.assignments.queries.getAssignmentWithCourse,
    { assignmentId }
  )

  const updateAssignment = useMutation(api.assignments.mutations.updateAssignment)
  const gradeSubmission = useMutation(api.assignments.mutations.gradeSubmission)

  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editDueDate, setEditDueDate] = useState("")
  const [editMaxScore, setEditMaxScore] = useState("")
  const [editAllowLate, setEditAllowLate] = useState(false)
  const [editAllowResub, setEditAllowResub] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)

  // grading state — track which submission is being graded
  const [gradingId, setGradingId] = useState<Id<"submissions"> | null>(null)
  const [gradeScore, setGradeScore] = useState("")
  const [gradeFeedback, setGradeFeedback] = useState("")
  const [grading, setGrading] = useState(false)

  if (assignmentData && !initialized) {
    setEditTitle(assignmentData.assignment.title)
    setEditDesc(assignmentData.assignment.description ?? "")
    setEditDueDate(assignmentData.assignment.dueDate)
    setEditMaxScore(String(assignmentData.assignment.maxScore))
    setEditAllowLate(assignmentData.assignment.allowLateSubmission)
    setEditAllowResub(assignmentData.assignment.allowResubmission)
    setInitialized(true)
  }

  const submissions = useQuery(
    api.assignments.queries.getSubmissionsByAssignment,
    assignmentData
      ? { assignmentId, courseId: assignmentData.courseId }
      : "skip"
  )

  async function handleSave() {
    setSaving(true)
    try {
      await updateAssignment({
        assignmentId,
        title: editTitle.trim() || undefined,
        description: editDesc.trim() || undefined,
        dueDate: editDueDate || undefined,
        maxScore: Number(editMaxScore),
        allowLateSubmission: editAllowLate,
        allowResubmission: editAllowResub,
      })
      toast.success("Saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  async function handleGrade(submissionId: Id<"submissions">) {
    setGrading(true)
    try {
      await gradeSubmission({
        submissionId,
        score: Number(gradeScore),
        feedback: gradeFeedback.trim() || undefined,
      })
      toast.success("Graded")
      setGradingId(null)
      setGradeScore("")
      setGradeFeedback("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setGrading(false)
    }
  }

  if (!assignmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <SidebarProvider style={{
      "--sidebar-width": "calc(var(--spacing) * 72)",
      "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-8 p-6 max-w-3xl">

          <button
            onClick={() => router.push("/teacher/assignments")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to assignments
          </button>

          {/* section 1 — edit assignment details */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Edit Assignment</h1>

            <div className="flex flex-col gap-1.5">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label>Due date</Label>
                <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 w-28">
                <Label>Max score</Label>
                <Input type="number" value={editMaxScore} onChange={(e) => setEditMaxScore(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editAllowLate} onChange={(e) => setEditAllowLate(e.target.checked)} />
                Allow late submission
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editAllowResub} onChange={(e) => setEditAllowResub(e.target.checked)} />
                Allow resubmission
              </label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-fit">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="border-t" />

          {/* section 2 — submissions list + grading */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">
              Submissions
              {submissions && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {submissions.length} total
                </span>
              )}
            </h2>

            {submissions === undefined && (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}

            {submissions?.length === 0 && (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            )}

            {submissions && submissions.length > 0 && (
              <div className="flex flex-col gap-3">
                {submissions.map((sub: any) => (
                  <div key={sub._id} className="rounded-lg border p-4 flex flex-col gap-3">

                    {/* student info + status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{sub.studentName}</p>
                        <p className="text-xs text-muted-foreground">{sub.studentEmail}</p>
                      </div>
                      <Badge
                        className={
                          sub.status === "graded"
                            ? "bg-green-100 text-green-700 border-0"
                            : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {sub.status}
                      </Badge>
                    </div>

                    {/* what they submitted */}
                    {sub.textSubmission && (
                      <p className="text-sm bg-muted/50 rounded p-3 whitespace-pre-wrap">
                        {sub.textSubmission}
                      </p>
                    )}
                    {sub.linkUrl && (
                      <a
                        href={sub.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {sub.linkUrl}
                      </a>
                    )}

                    {/* existing grade */}
                    {sub.status === "graded" && (
                      <p className="text-sm text-muted-foreground">
                        Score: {sub.score}/{assignmentData.assignment.maxScore}
                        {sub.feedback && ` · ${sub.feedback}`}
                      </p>
                    )}

                    {/* grading form — toggle per submission */}
                    {gradingId === sub._id ? (
                      <div className="flex flex-col gap-2 border-t pt-3">
                        <div className="flex gap-3 items-end">
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs">Score</Label>
                            <Input
                              type="number"
                              value={gradeScore}
                              onChange={(e) => setGradeScore(e.target.value)}
                              className="w-24 h-8"
                              placeholder={`/ ${assignmentData.assignment.maxScore}`}
                            />
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <Label className="text-xs">Feedback (optional)</Label>
                            <Input
                              value={gradeFeedback}
                              onChange={(e) => setGradeFeedback(e.target.value)}
                              className="h-8"
                              placeholder="Well done..."
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleGrade(sub._id)}
                            disabled={grading || !gradeScore}
                          >
                            {grading ? "Saving..." : "Save Grade"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setGradingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-fit"
                        onClick={() => {
                          setGradingId(sub._id)
                          setGradeScore(sub.score ? String(sub.score) : "")
                          setGradeFeedback(sub.feedback ?? "")
                        }}
                      >
                        {sub.status === "graded" ? "Edit Grade" : "Grade"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}