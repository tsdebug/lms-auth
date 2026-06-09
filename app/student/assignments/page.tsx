"use client"

// Student assignments page
// same table pattern as student quizzes
// columns: Assignment, Course, Chapter, Lesson, Due Date, Status, Score

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { CheckCircleIcon, CircleIcon, ClockIcon } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

type StudentAssignmentRow = {
  _id: Id<"assignments">
  title: string
  courseTitle: string
  courseId: Id<"courses">
  chapterTitle: string
  lessonTitle: string | undefined
  lessonId: Id<"lessons"> | undefined
  navigationLessonId: Id<"lessons"> | undefined
  dueDate: string
  maxScore: number
  submitted: boolean
  submissionStatus: string | null
  score: number | null
  isPastDue: boolean
}

export default function StudentAssignmentsPage() {
  const router = useRouter()
  const grouped = useQuery(api.assignments.queries.getAllAssignmentsForStudent)

  const tableData: StudentAssignmentRow[] = (grouped ?? []).flatMap((group: any) =>
    group.assignments.map((a: any) => ({
      _id: a._id,
      title: a.title,
      courseTitle: group.courseTitle,
      courseId: group.courseId,
      chapterTitle: a.chapterTitle,
      lessonTitle: a.lessonId
        ? a.belongsTo.replace("Lesson: ", "")
        : undefined,
      lessonId: a.lessonId ?? undefined,
      navigationLessonId: a.navigationLessonId ?? undefined,
      dueDate: a.dueDate,
      maxScore: a.maxScore,
      submitted: a.submitted,
      submissionStatus: a.submissionStatus,
      score: a.score,
      isPastDue: new Date(a.dueDate) < new Date(),
    }))
  )

  const columns: ColumnDef<StudentAssignmentRow>[] = [
    {
      accessorKey: "title",
      header: "Assignment",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.submitted ? (
            <CheckCircleIcon className="size-4 text-green-500 shrink-0" />
          ) : (
            <CircleIcon className="size-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "courseTitle",
      header: "Course",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.courseTitle}</span>
      ),
    },
    {
      accessorKey: "chapterTitle",
      header: "Chapter",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.chapterTitle}</span>
      ),
    },
    {
      accessorKey: "lessonTitle",
      header: "Lesson",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lessonTitle ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due",
      cell: ({ row }) => (
        <span className={`text-sm flex items-center gap-1 ${
          row.original.isPastDue && !row.original.submitted
            ? "text-destructive"
            : "text-muted-foreground"
        }`}>
          <ClockIcon className="size-3" />
          {row.original.dueDate}
        </span>
      ),
    },
    {
      accessorKey: "submissionStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.submissionStatus
        return (
          <Badge
            variant={row.original.submitted ? "secondary" : "outline"}
            className={status === "graded" ? "bg-green-100 text-green-700 border-0" : ""}
          >
            {status ?? "Pending"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: ({ row }) => {
        if (row.original.score === null) {
          return (
            <span className="text-sm text-muted-foreground">
              — / {row.original.maxScore}
            </span>
          )
        }
        return (
          <span className="text-sm">
            {row.original.score} / {row.original.maxScore}
          </span>
        )
      },
    },
    {
      id: "action",
      cell: ({ row }) => {
        const targetLessonId =
          row.original.lessonId ?? row.original.navigationLessonId
        if (!targetLessonId) {
          return (
            <span className="text-xs text-muted-foreground">No lesson yet</span>
          )
        }
        return (
          <button
            onClick={() =>
              router.push(
                `/student/courses/${row.original.courseId}/lessons/${targetLessonId}`
              )
            }
            className="text-xs text-primary hover:underline"
          >
            {row.original.submitted ? "View" : "Submit"}
          </button>
        )
      },
    },
  ]

  return (
    <SidebarProvider style={{
      "--sidebar-width": "calc(var(--spacing) * 72)",
      "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold">Assignments</h1>
            <p className="text-sm text-muted-foreground">
              All assignments from your enrolled courses
            </p>
          </div>

          {grouped === undefined && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {grouped !== undefined && tableData.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No assignments yet.
            </p>
          )}

          {grouped !== undefined && tableData.length > 0 && (
            <DataTable data={tableData} columns={columns} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}