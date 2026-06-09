"use client"

// QuizPlayer — student-facing quiz UI
// CHANGED: now uses getQuizForStudent (isCorrect stripped server-side)
// receives courseId as a new required prop so the query can verify enrollment

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { CheckCircleIcon, XCircleIcon } from "lucide-react"
import { toast } from "sonner"

interface QuizPlayerProps {
  lessonId: Id<"lessons">
  courseId: Id<"courses">  // ADDED: needed for enrollment check in getQuizForStudent
  chapterId?: Id<"chapters">
}

export function QuizPlayer({ lessonId, courseId, chapterId }: QuizPlayerProps) {
  // CHANGED: when chapterId is present, load the chapter-level quiz instead
  // otherwise fall back to the lesson-level quiz
  const lessonQuiz = useQuery(
    api.quizzes.queries.getQuizForStudent,
    chapterId ? "skip" : { lessonId, courseId }
  )
  const chapterQuiz = useQuery(
    api.quizzes.queries.getQuizByChapterForStudent,
    chapterId ? { chapterId, courseId } : "skip"
  )
  const quiz = chapterId ? chapterQuiz : lessonQuiz

  const existingAttempt = useQuery(
    api.quizzes.queries.getQuizAttempt,
    quiz?._id ? { quizId: quiz._id } : "skip"
  )

  const submitQuiz = useMutation(api.quizzes.mutations.submitQuiz)

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, Id<"q_answers">>
  >({})

  const [result, setResult] = useState<{
    score: number
    maxScore: number
    results: {
      questionId: Id<"q_questions">
      chosenAnswerId: Id<"q_answers">
      correctAnswerId: Id<"q_answers"> | undefined
      isCorrect: boolean
    }[]
  } | null>(null)

  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!quiz) return

    const unanswered = quiz.questions.filter((q) => !selectedAnswers[q._id])
    if (unanswered.length > 0) {
      toast.error(`Answer all ${quiz.questions.length} questions before submitting`)
      return
    }

    setSubmitting(true)
    try {
      const res = await submitQuiz({
        quizId: quiz._id,
        answers: Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
          questionId: questionId as Id<"q_questions">,
          answerId: answerId as Id<"q_answers">,
        })),
      })
      setResult(res)
      toast.success(`Submitted! Score: ${res.score}/${res.maxScore}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit")
    } finally {
      setSubmitting(false)
    }
  }

  if (quiz === undefined || existingAttempt === undefined) {
    return <div className="text-sm text-muted-foreground">Loading quiz...</div>
  }

  if (quiz === null) return null

  const showResults = result !== null || existingAttempt !== null

  if (showResults) {
    const score = result?.score ?? existingAttempt?.score ?? 0
    const maxScore = result?.maxScore ?? existingAttempt?.maxScore ?? 0
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    const passed = percentage >= 70

    return (
      <div className="rounded-lg border p-4 flex flex-col gap-4">
        <h3 className="font-semibold">{quiz.title}</h3>

        <div className="rounded-lg bg-muted/50 p-6 text-center flex flex-col gap-2">
          <p className="text-4xl font-bold">{score}/{maxScore}</p>
          <p className="text-lg font-medium">{percentage}%</p>
          <span className={`inline-flex mx-auto items-center rounded-full px-3 py-1 text-sm font-medium ${passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {passed ? "Passed" : "Not passed"}
          </span>
        </div>

        {/* detailed breakdown — only available on fresh submission */}
        {/* submitQuiz mutation returns correctAnswerId so we can show it here */}
        {/* existing attempt data doesn't include it, which is intentional */}
        {result && (
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Review</h4>
            {quiz.questions.map((question, qi) => {
              const qResult = result.results.find((r) => r.questionId === question._id)
              return (
                <div key={question._id} className="rounded-md border p-3 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    {qResult?.isCorrect ? (
                      <CheckCircleIcon className="size-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircleIcon className="size-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <p className="text-sm font-medium">Q{qi + 1}. {question.content}</p>
                  </div>

                  <div className="flex flex-col gap-1 pl-6">
                    {question.answers.map((answer) => {
                      const wasChosen = answer._id === qResult?.chosenAnswerId
                      const isCorrect = answer._id === qResult?.correctAnswerId
                      return (
                        <div
                          key={answer._id}
                          className={`text-sm px-2 py-1 rounded ${
                            isCorrect
                              ? "bg-green-50 text-green-700 font-medium"
                              : wasChosen && !isCorrect
                              ? "bg-red-50 text-red-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          {wasChosen && !isCorrect && "✗ "}
                          {isCorrect && "✓ "}
                          {answer.content}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{quiz.title}</h3>
        <span className="text-xs text-muted-foreground">
          {quiz.questions.length} questions · {quiz.totalScore} pts
        </span>
      </div>

      {quiz.questions.map((question, qi) => (
        <div key={question._id} className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            Q{qi + 1}. {question.content}
            <span className="text-xs text-muted-foreground ml-2">({question.quesScore} pts)</span>
          </p>

          <div className="flex flex-col gap-1.5 pl-2">
            {question.answers.map((answer) => {
              const isSelected = selectedAnswers[question._id] === answer._id
              return (
                <label
                  key={answer._id}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question._id}`}
                    checked={isSelected}
                    onChange={() =>
                      setSelectedAnswers((prev) => ({ ...prev, [question._id]: answer._id }))
                    }
                    className="shrink-0"
                  />
                  {answer.content}
                </label>
              )
            })}
          </div>
        </div>
      ))}

      <p className="text-xs text-muted-foreground">
        {Object.keys(selectedAnswers).length}/{quiz.questions.length} answered
      </p>

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(selectedAnswers).length < quiz.questions.length}
        >
          {submitting ? "Submitting..." : "Submit Quiz"}
        </Button>
      </div>
    </div>
  )
}