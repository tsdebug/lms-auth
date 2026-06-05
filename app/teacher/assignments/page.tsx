"use client"

// Teacher assignments list page
// same structure as quizzes page — columns for course, chapter, lesson
// lesson column is blank for chapter-level assignments

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Id } from "@/convex/_generated/dataModel"

type AssignmentRow = {
  id: Id<"assignments">
  _id: Id<"assignments">
  title: string
  courseTitle: string
  chapterTitle: string
  lessonTitle: string | undefined  // undefined = chapter-level
  dueDate: string
  maxScore: number
  submissionCount: number
}

function AssignmentActions({
  row,
  onEdit,
}: {
  row: AssignmentRow
  onEdit: () => void
}) {
  const deleteAssignment = useMutation(api.assignments.mutations.deleteAssignment)

  async function handleDelete() {
    try {
      await deleteAssignment({ assignmentId: row._id })
      toast.success("Assignment deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="size-8" onClick={onEdit}>
        <PencilIcon className="size-3.5" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              Cannot delete if students have already submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function TeacherAssignmentsPage() {
  const router = useRouter()
  const rawAssignments = useQuery(api.assignments.queries.getAllAssignmentsForTeacher)

  const tableData: AssignmentRow[] = (rawAssignments ?? []).map((a: any) => ({
    id: a._id,
    _id: a._id,
    title: a.title,
    courseTitle: a.courseTitle,
    chapterTitle: a.chapterTitle,
    // same logic as quizzes — lessonId present = lesson level, show title
    // no lessonId = chapter level, show "—" in table
    lessonTitle: a.lessonId
      ? a.belongsTo.replace("Lesson: ", "")
      : undefined,
    dueDate: a.dueDate,
    maxScore: a.maxScore,
    submissionCount: a.submissionCount,
  }))

  const columns: ColumnDef<AssignmentRow>[] = [
    {
      accessorKey: "title",
      header: "Assignment",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
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
      cell: ({ row }) => {
        // highlight past due in red so teacher notices immediately
        const isPast = new Date(row.original.dueDate) < new Date()
        return (
          <span className={`text-sm ${isPast ? "text-destructive" : ""}`}>
            {row.original.dueDate}
          </span>
        )
      },
    },
    {
      accessorKey: "submissionCount",
      header: "Submissions",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.submissionCount}</Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <AssignmentActions
          row={row.original}
          onEdit={() =>
            router.push(`/teacher/assignments/${row.original._id}`)
          }
        />
      ),
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Assignments</h1>
              <p className="text-sm text-muted-foreground">
                All assignments across your courses
              </p>
            </div>
            <Button onClick={() => router.push("/teacher/assignments/new")}>
              <PlusIcon className="size-4 mr-1" />
              New Assignment
            </Button>
          </div>

          {rawAssignments === undefined && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {rawAssignments !== undefined && (
            <DataTable data={tableData} columns={columns} />
          )}

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}