"use client"

// standalone quiz editor — same QuizBuilder but accessed from the quizzes list
// WHY SEPARATE PAGE: teacher can now reach any quiz directly without
// going through the lesson editor

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { QuizBuilder } from "@/components/quiz/QuizBuilder"
import { ArrowLeftIcon } from "lucide-react"

export default function QuizEditorPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.quizId as Id<"quizzes">

  // fetch quiz to get lessonId or chapterId for QuizBuilder
  const quiz = useQuery(api.quizzes.queries.getQuizById, { quizId })

  return (
    <SidebarProvider style={{
      "--sidebar-width": "calc(var(--spacing) * 72)",
      "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-3xl">
          <button
            onClick={() => router.push("/teacher/quizzes")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to quizzes
          </button>

          <div>
            <h1 className="text-2xl font-semibold">Edit Quiz</h1>
            <p className="text-sm text-muted-foreground">
              Add, edit or remove questions and answers.
            </p>
          </div>

          {quiz && (
            <QuizBuilder
              // QuizBuilder accepts lessonId — pass it if available
              // if chapter quiz, we need to extend QuizBuilder to accept chapterId too
              // for now pass lessonId if it exists
              lessonId={quiz.lessonId}
              chapterId={quiz.chapterId}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}