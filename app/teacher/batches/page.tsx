"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { AppSidebar } from "@/components/app-sidebar"
import { CreateBatchDialog } from "@/components/batches/CreateBatchDialog"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Id } from "@/convex/_generated/dataModel"

type BatchRow = {
  id: Id<"batches">
  name: string
  status: "upcoming" | "active" | "completed"
  startDate: string
  endDate: string
}

const statusStyles: Record<BatchRow["status"], string> = {
  upcoming: "border-amber-200 bg-amber-50 text-amber-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-slate-200 bg-slate-50 text-slate-700",
}

export default function TeacherBatchesPage() {
  const batches = useQuery(api.batches.queries.getBatchesByInstructor, {})

  const tableData: BatchRow[] = (batches ?? []).map((batch: any) => ({
    id: batch._id,
    name: batch.name,
    status: batch.status,
    startDate: batch.startDate,
    endDate: batch.endDate,
  }))

  const columns: ColumnDef<BatchRow>[] = [
    {
      accessorKey: "name",
      header: "Batch",
      cell: ({ row }) => (
        <Link
          href={`/teacher/batches/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={statusStyles[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Start date",
      cell: ({ row }) => <span className="text-sm">{row.original.startDate}</span>,
    },
    {
      accessorKey: "endDate",
      header: "End date",
      cell: ({ row }) => <span className="text-sm">{row.original.endDate}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/teacher/batches/${row.original.id}`}>View</Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Batches</h1>
              <p className="text-sm text-muted-foreground">
                Manage cohorts, instructors, and enrollment windows
              </p>
            </div>
            <CreateBatchDialog />
          </div>

          {batches === undefined && (
            <p className="text-sm text-muted-foreground">Loading batches...</p>
          )}

          {batches !== undefined && batches.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
              <p className="text-sm text-muted-foreground">No batches yet.</p>
              <CreateBatchDialog />
            </div>
          )}

          {batches && batches.length > 0 && (
            <DataTable data={tableData} columns={columns} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}