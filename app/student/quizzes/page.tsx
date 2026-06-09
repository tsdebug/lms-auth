"use client"

// Student quizzes page
// shows all quizzes from enrolled courses in a table
// columns: Quiz, Course, Chapter, Lesson (blank if chapter-level), Status, Score

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { CheckCircleIcon, CircleIcon } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

type StudentQuizRow = {
  _id: Id<"quizzes">
  title: string
  courseTitle: string
  courseId: Id<"courses">
  chapterTitle: string
  // undefined = chapter-level quiz, no lesson
  lessonTitle: string | undefined
  lessonId: Id<"lessons"> | undefined
  navigationLessonId: Id<"lessons"> | undefined
  totalScore: number
  attempted: boolean
  score: number | null
  maxScore: number | null
}

export default function StudentQuizzesPage() {
  const router = useRouter()
  const grouped = useQuery(api.quizzes.queries.getAllQuizzesForStudent)

  // flatten grouped data into rows for the table
  // WHY FLATTEN: DataTable expects a flat array, not grouped by course
  // we keep courseTitle as a column instead so grouping is still visible
  const tableData: StudentQuizRow[] = (grouped ?? []).flatMap((group: any) =>
    group.quizzes.map((quiz: any) => ({
      _id: quiz._id,
      title: quiz.title,
      courseTitle: group.courseTitle,
      courseId: group.courseId,
      chapterTitle: quiz.chapterTitle,
      // if quiz has lessonId it belongs to a lesson — extract title from belongsTo
      // belongsTo is "Lesson: <title>" or "Chapter: <title>"
      lessonTitle: quiz.lessonId
        ? quiz.belongsTo.replace("Lesson: ", "")
        : undefined,
      lessonId: quiz.lessonId ?? undefined,
      navigationLessonId: quiz.navigationLessonId ?? undefined,
      totalScore: quiz.totalScore,
      attempted: quiz.attempted,
      score: quiz.score,
      maxScore: quiz.maxScore,
    }))
  )

  const columns: ColumnDef<StudentQuizRow>[] = [
    {
      accessorKey: "title",
      header: "Quiz",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* completion icon so student can scan at a glance */}
          {row.original.attempted ? (
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
        // blank dash for chapter-level quizzes
        <span className="text-sm text-muted-foreground">
          {row.original.lessonTitle ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "attempted",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.attempted ? "secondary" : "outline"}>
          {row.original.attempted ? "Done" : "Pending"}
        </Badge>
      ),
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: ({ row }) => {
        if (!row.original.attempted || row.original.score === null) {
          return (
            <span className="text-sm text-muted-foreground">
              — / {row.original.totalScore}
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
        // only show Take button if not attempted and quiz is lesson-level
        // chapter-level quizzes show on the lesson page automatically
        if (row.original.attempted) return null
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
            Take
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
            <h1 className="text-2xl font-semibold">Quizzes</h1>
            <p className="text-sm text-muted-foreground">
              All quizzes from your enrolled courses
            </p>
          </div>

          {grouped === undefined && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {grouped !== undefined && tableData.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No quizzes yet. Enroll in a course to get started.
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