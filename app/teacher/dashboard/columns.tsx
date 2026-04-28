"use client"

import { ColumnDef } from "@tanstack/react-table"
import { EllipsisVerticalIcon } from "lucide-react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export type TeacherCourseRow = {
  id: number
  convexId: Id<"courses">  // real Convex ID for mutations
  title: string
  status: "draft" | "published" | "archived"
  myRole: string
  studentCount: number
  difficultyLevel: string | undefined
}

// separate component so hooks work correctly inside columns
function CourseActions({ row }: { row: TeacherCourseRow }) {
  const publishCourse = useMutation(api.courses.mutations.publishCourse)
  const archiveCourse = useMutation(api.courses.mutations.archiveCourse)

  async function handlePublish() {
    try {
      await publishCourse({ courseId: row.convexId })
      toast.success("Course published successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish")
    }
  }

  async function handleArchive() {
    try {
      await archiveCourse({ courseId: row.convexId })
      toast.success("Course archived")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive")
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <EllipsisVerticalIcon className="size-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            onClick={() => window.location.href = `/teacher/courses/${row.convexId}/edit`}
          >
            Edit
          </DropdownMenuItem>

          {/* only show publish if draft */}
          {row.status === "draft" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Publish
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish this course?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Students will be able to see and enroll in this course immediately.
                    Make sure all chapters have at least one lesson.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePublish}>
                    Publish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* only show archive if published */}
          {row.status === "published" && (
            <>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive"
                  >
                    Archive
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive this course?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This course will be hidden from public listings.
                      Existing enrollments will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleArchive}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Archive
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export const teacherColumns: ColumnDef<TeacherCourseRow>[] = [
  {
    accessorKey: "title",
    header: "Course Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
    ),
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
      <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
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
    cell: ({ row }) => <CourseActions row={row.original} />,
  },
]