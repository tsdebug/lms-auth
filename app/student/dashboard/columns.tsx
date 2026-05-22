"use client"

// purpose: defines the columns for the student enrolled courses table
// used by: StudentCoursesTable.tsx which passes these to DataTable
// EACH COLUMN maps to a field in StudentCourseRow type

import { ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"

export type StudentCourseRow = {
  id: string
  courseId: string           // needed for navigation to course detail page
  courseTitle: string
  enrollmentStatus: "active" | "completed" | "dropped"
  instructorName: string
  difficultyLevel: string | undefined
  progressPercent: number    // 0-100
  completedLessons: number
  totalLessons: number
}

// CourseTitleCell — separate component because useRouter is a hook
// hooks cannot be called inside plain column cell functions
// must be a proper React component to use hooks
function CourseTitleCell({ row }: { row: StudentCourseRow }) {
  const router = useRouter()
  return (
    <button
      className="font-medium text-left hover:underline text-foreground"
      // clicking goes to course detail page where student picks a lesson
      onClick={() => router.push(`/courses/${row.courseId}`)}
    >
      {row.courseTitle}
    </button>
  )
}

export const studentColumns: ColumnDef<StudentCourseRow>[] = [
  {
    accessorKey: "courseTitle",
    header: "Course",
    // CourseTitleCell handles click -> navigation
    cell: ({ row }) => <CourseTitleCell row={row.original} />,
  },
  {
    accessorKey: "enrollmentStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.enrollmentStatus
      const badgeClass =
        status === "completed"
          ? "bg-primary text-primary-foreground"
          : status === "active"
          ? "bg-secondary text-secondary-foreground"
          : "border border-border text-foreground"
      return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${badgeClass}`}>
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: "instructorName",
    header: "Instructor",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.instructorName}</span>
    ),
  },
  {
    accessorKey: "difficultyLevel",
    header: "Difficulty",
    cell: ({ row }) => (
      <span className="capitalize text-sm">
        {row.original.difficultyLevel ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "progressPercent",
    header: "Progress",
    cell: ({ row }) => {
      const { progressPercent, completedLessons, totalLessons } = row.original
      return (
        <div className="flex flex-col gap-1 min-w-[120px]">
          {/* progress bar — width driven by progressPercent value */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* numeric label */}
          <span className="text-xs text-muted-foreground">
            {completedLessons}/{totalLessons} · {progressPercent}%
          </span>
        </div>
      )
    },
  },
]