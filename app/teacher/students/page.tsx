"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { UsersIcon } from "lucide-react"

type CourseProgress = {
  courseId: string
  courseTitle: string
  enrollmentStatus: string
  progressPercent: number
  completedLessons: number
  totalLessons: number
}

type StudentRow = {
  _id: string
  userId: string
  name: string
  email: string
  totalCourses: number
  quizzesTaken: number
  avgQuizScore: number | null
  assignmentsSubmitted: number
  lastActiveAt: number | null  // timestamp of most recent lesson completion
  hasCompletedAnyCourse: boolean
  courses: CourseProgress[]
}

function StudentDetailSheet({
  student,
  open,
  onClose,
}: {
  student: StudentRow | null
  open: boolean
  onClose: () => void
}) {
  if (!student) return null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>{student.name}</SheetTitle>
          <p className="text-sm text-muted-foreground">{student.email}</p>

          {/* quick stats row */}
          <div className="flex gap-3 mt-3 flex-wrap">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground">Quizzes taken</p>
              <p className="text-sm font-semibold">{student.quizzesTaken}</p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground">Avg quiz score</p>
              <p className="text-sm font-semibold">
                {student.avgQuizScore !== null
                  ? `${student.avgQuizScore}%`
                  : "—"}
              </p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground">Assignments</p>
              <p className="text-sm font-semibold">
                {student.assignmentsSubmitted} submitted
              </p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground">Last active</p>
              <p className="text-sm font-semibold">
                {student.lastActiveAt
                  ? new Date(student.lastActiveAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Never"}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* per-course breakdown */}
        <div className="flex flex-col gap-3 p-6">
          <p className="text-sm font-medium">Course breakdown</p>

          {student.courses.map((course) => (
            <div
              key={course.courseId}
              className="rounded-lg border p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight">
                  {course.courseTitle}
                </p>
                <Badge
                  variant="outline"
                  className={
                    course.enrollmentStatus === "completed"
                      ? "bg-green-100 text-green-700 border-0 shrink-0"
                      : "shrink-0 capitalize"
                  }
                >
                  {course.enrollmentStatus}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">
                  {course.progressPercent}%
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {course.completedLessons} of {course.totalLessons} lessons completed
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function TeacherStudentsPage() {
  const rawStudents = useQuery(api.users.queries.getStudentsForTeacher)
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null)

  const tableData: StudentRow[] = (rawStudents ?? []).map((s: any) => ({
    _id: s.userId,
    userId: s.userId,
    name: s.name,
    email: s.email,
    totalCourses: s.totalCourses,
    quizzesTaken: s.quizzesTaken ?? 0,
    avgQuizScore: s.avgQuizScore ?? null,
    assignmentsSubmitted: s.assignmentsSubmitted ?? 0,
    lastActiveAt: s.lastActiveAt ?? null,
    hasCompletedAnyCourse: s.courses?.some(
      (c: any) => c.enrollmentStatus === "completed"
    ) ?? false,
    courses: s.courses ?? [],
  }))

  const columns: ColumnDef<StudentRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "totalCourses",
      header: "Courses",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.totalCourses}</Badge>
      ),
    },
    {
      accessorKey: "quizzesTaken",
      header: "Quizzes",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{row.original.quizzesTaken} taken</span>
          <span className="text-xs text-muted-foreground">
            {row.original.avgQuizScore !== null
              ? `avg ${row.original.avgQuizScore}%`
              : "no attempts"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "assignmentsSubmitted",
      header: "Assignments",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.assignmentsSubmitted} submitted
        </span>
      ),
    },
    {
      accessorKey: "lastActiveAt",
      header: "Last active",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastActiveAt
            ? new Date(row.original.lastActiveAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Never"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedStudent(row.original)}
        >
          View
        </Button>
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
          <div>
            <h1 className="text-2xl font-semibold">Students</h1>
            <p className="text-sm text-muted-foreground">
              All students enrolled in your courses
            </p>
          </div>

          {rawStudents === undefined && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {rawStudents?.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <UsersIcon className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No students enrolled yet.
              </p>
            </div>
          )}

          {rawStudents !== undefined && rawStudents.length > 0 && (
            <DataTable data={tableData} columns={columns} />
          )}
        </div>
      </SidebarInset>

      <StudentDetailSheet
        student={selectedStudent}
        open={selectedStudent !== null}
        onClose={() => setSelectedStudent(null)}
      />
    </SidebarProvider>
  )
}