"use client"

import { ColumnDef } from "@tanstack/react-table"

export type StudentCourseRow = {
  id: number
  header: string
  type: string
  status: string
  target: string
  limit: string
  reviewer: string
}

export const studentColumns: ColumnDef<StudentCourseRow>[] = [
  {
    accessorKey: "header",
    header: "Course",
    cell: ({ row }) => <span className="font-medium">{row.original.header}</span>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <span>{row.original.type}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const statusClass =
        status === "Done"
          ? "bg-primary text-primary-foreground"
          : status === "In Progress"
          ? "bg-secondary text-secondary-foreground"
          : "border border-border text-foreground"

      return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusClass}`}>
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: "target",
    header: "Target",
    cell: ({ row }) => <span>{row.original.target}</span>,
  },
  {
    accessorKey: "limit",
    header: "Limit",
    cell: ({ row }) => <span>{row.original.limit}</span>,
  },
  {
    accessorKey: "reviewer",
    header: "Reviewer",
    cell: ({ row }) => <span>{row.original.reviewer}</span>,
  },
]