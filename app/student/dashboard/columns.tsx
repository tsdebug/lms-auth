"use client"

import { ColumnDef } from "@tanstack/react-table"

export type StudentCourseRow = {
  id: string
  courseTitle: string
  enrollmentStatus: "active" | "completed" | "dropped"
  instructorName: string
  difficultyLevel: string | undefined
}

export const studentColumns: ColumnDef<StudentCourseRow>[] = [
  {
    accessorKey: "courseTitle",
    header: "Course",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.courseTitle}</span>
    ),
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
    cell: ({ row }) => <span>{row.original.instructorName}</span>,
  },
  {
    accessorKey: "difficultyLevel",
    header: "Difficulty",
    cell: ({ row }) => (
      <span className="capitalize">
        {row.original.difficultyLevel ?? "—"}
      </span>
    ),
  },
]