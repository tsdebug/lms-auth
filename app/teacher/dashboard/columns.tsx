"use client"

import { ColumnDef } from "@tanstack/react-table"
import { EllipsisVerticalIcon } from "lucide-react"

export type TeacherCourseRow = {
  id: number
  title: string
  status: "draft" | "published" | "archived"
  myRole: string
  studentCount: number
  difficultyLevel: string | undefined
}

export const teacherColumns: ColumnDef<TeacherCourseRow>[] = [
  {
    accessorKey: "title",
    header: "Course Title",
    cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const badgeClass =
        status === "published"
          ? "bg-primary text-primary-foreground"
          : status === "draft"
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
    accessorKey: "myRole",
    header: "My Role",
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium">
        {row.original.myRole}
      </span>
    ),
  },
  {
    accessorKey: "studentCount",
    header: "Students",
    cell: ({ row }) => <span>{row.original.studentCount}</span>,
  },
  {
    accessorKey: "difficultyLevel",
    header: "Difficulty",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.difficultyLevel ?? "—"}</span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label={`Actions for ${row.original.title}`}
        >
          <EllipsisVerticalIcon className="size-4" />
        </button>
        <button type="button" className="rounded-md border px-2 py-1 text-xs hover:bg-accent">
          Edit
        </button>
        <button type="button" className="rounded-md border px-2 py-1 text-xs hover:bg-accent">
          Publish
        </button>
        <button type="button" className="rounded-md border border-destructive px-2 py-1 text-xs text-destructive hover:bg-destructive/10">
          Archive
        </button>
      </div>
    ),
  },
]