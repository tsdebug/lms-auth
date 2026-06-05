"use client"

// Teacher quizzes list page
// WHAT: shows all quizzes across all teacher's courses in a table
// each row has: quiz title, course it belongs to, chapter, lesson (blank if chapter-level)
// WHY TABLE: easier to scan than a list, consistent with courses page pattern

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

// QuizRow — shape of each row in the table
// WHY DEFINE THIS TYPE: gives us type safety in column definitions
// so we know exactly what fields are available per row
type QuizRow = {
  id: string
  _id: Id<"quizzes">
  title: string
  courseTitle: string
  chapterTitle: string
  // lessonTitle is undefined for chapter-level quizzes
  // we show "—" in the cell when this is missing
  lessonTitle: string | undefined
  totalScore: number
  questionCount: number
}

// QuizActions — separate component because useMutation is a hook
// hooks CANNOT be called inside column cell functions (not React components)
// so we wrap actions in their own component
function QuizActions({ row, onEdit }: { row: QuizRow; onEdit: () => void }) {
  const deleteQuiz = useMutation(api.quizzes.mutations.deleteQuiz)

  async function handleDelete() {
    try {
      await deleteQuiz({ quizId: row._id })
      toast.success("Quiz deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {/* edit — goes to standalone quiz editor page */}
      <Button variant="ghost" size="icon" className="size-8" onClick={onEdit}>
        <PencilIcon className="size-3.5" />
      </Button>

      {/* delete with confirmation dialog */}
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
            <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              All questions and answers will be permanently deleted.
              Student attempts will remain for record keeping.
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

export default function TeacherQuizzesPage() {
  const router = useRouter()

  // getAllQuizzesForTeacher returns flat array of quizzes
  // each item already has courseTitle, chapterTitle, belongsTo enriched
  // from the query — no extra fetching needed here
  const rawQuizzes = useQuery(api.quizzes.queries.getAllQuizzesForTeacher)

  // shape raw query data into QuizRow for the table
  // WHY SEPARATE: keeps the column definitions clean and typed
  const tableData: QuizRow[] = (rawQuizzes ?? []).map((q: any) => ({
    id: String(q._id),
    _id: q._id,
    title: q.title,
    courseTitle: q.courseTitle,
    chapterTitle: q.chapterTitle,
    // if quiz has a lessonId → belongs to a lesson, show lesson title
    // if no lessonId → chapter-level quiz, lessonTitle is undefined → shows "—"
    lessonTitle: q.lessonId ? q.belongsTo.replace("Lesson: ", "") : undefined,
    totalScore: q.totalScore,
    questionCount: q.questions?.length ?? 0,
  }))

  // column definitions for DataTable
  // PATTERN: same as teacherColumns in app/teacher/dashboard/columns.tsx
  const columns: ColumnDef<QuizRow>[] = [
    {
      accessorKey: "title",
      header: "Quiz",
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
        // show "—" when quiz is chapter-level (no lesson)
        // this makes it immediately obvious which quizzes are chapter vs lesson level
        <span className="text-sm text-muted-foreground">
          {row.original.lessonTitle ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "totalScore",
      header: "Score",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.totalScore} pts</Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <QuizActions
          row={row.original}
          onEdit={() => router.push(`/teacher/quizzes/${row.original._id}`)}
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
              <h1 className="text-2xl font-semibold">Quizzes</h1>
              <p className="text-sm text-muted-foreground">
                All quizzes across your courses
              </p>
            </div>
            <Button onClick={() => router.push("/teacher/quizzes/new")}>
              <PlusIcon className="size-4 mr-1" />
              New Quiz
            </Button>
          </div>

          {rawQuizzes === undefined && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {rawQuizzes !== undefined && (
            <DataTable data={tableData} columns={columns} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}