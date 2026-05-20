"use client"

// QuizPlayer — student-facing quiz UI
// used in: lesson viewer page below lesson content
// recieves: lessonId — fetches quiz through it
// calls:
//   getQuizByLesson query — fetch quiz + questions + answers
//   getQuizAttempt query — check if student already attempted
//   submitQuiz mutation — submit answers + get score
//
// Three visual states:
//   1. loading — queries in flight
//   2. not yet attempted — show questions with answer options
//   3. already attempted OR just submitted — show score + correct answers
//
// IMPORTANT: isCorrect field is hidden from student until after submission
//   student sees options as plain radio buttons, not which is correct

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { CheckCircleIcon, XCircleIcon } from "lucide-react"
import { toast } from "sonner"

interface QuizPlayerProps {
    lessonId: Id<"lessons">
}

export function QuizPlayer({ lessonId }: QuizPlayerProps) {
    // --- DATA LAYER ---

    // fetch quiz — null means no quiz on this lesson
    const quiz = useQuery(api.quizzes.queries.getQuizByLesson, { lessonId })

    // fetch existing attempt — null means not yet attempted
    // "skip" tells Convex not to run this query until quiz is loaded
    // we need quiz._id before we can query the attempt
    const existingAttempt = useQuery(
        api.quizzes.queries.getQuizAttempt,
        quiz?._id ? { quizId: quiz._id } : "skip"
    )

    const submitQuiz = useMutation(api.quizzes.mutations.submitQuiz)

    // --- UI STATE ---

    // selectedAnswers: maps questionId → answerId the student chose
    // e.g. { "question1_id": "answer2_id", "question2_id": "answer1_id" }
    const [selectedAnswers, setSelectedAnswers] = useState<
        Record<string, Id<"q_answers">>
    >({})

    // result: set after submission, holds score + per-question results
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

    // --- HANDLER ---

    async function handleSubmit() {
        if (!quiz) return // should never happen — submit button is hidden if quiz is null

        // validate all questions have been answered
        const unanswered = quiz.questions.filter(
            (q) => !selectedAnswers[q._id]
        )
        if (unanswered.length > 0) {
            toast.error(`Answer all ${quiz.questions.length} questions before submitting`)
            return
        }

        setSubmitting(true)
        try {
            const res = await submitQuiz({
                quizId: quiz._id,
                // convert selectedAnswers object into array for mutation
                // Object.entries turns { q1: a2 } into [["q1", "a2"]]
                answers: Object.entries(selectedAnswers).map(
                    ([questionId, answerId]) => ({
                        questionId: questionId as Id<"q_questions">,
                        answerId: answerId as Id<"q_answers">,
                    })
                ),
            })
            // store result — triggers results display
            setResult(res)
            toast.success(`Submitted! Score: ${res.score}/${res.maxScore}`)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to submit")
        } finally {
            setSubmitting(false)
        }
    }

    // --- RENDER ---

    // loading — either query still in flight
    if (quiz === undefined || existingAttempt === undefined) {
        return (
            <div className="text-sm text-muted-foreground">Loading quiz...</div>
        )
    }

    // no quiz on this lesson — render nothing
    if (quiz === null) return null

    // determine if we should show results
    // true if: student just submitted (result state set)
    //       OR student had a previous attempt (existingAttempt exists)
    const showResults = result !== null || existingAttempt !== null

    // --- STATE 3: show results ---
    if (showResults) {
        // use fresh result from submission if available
        // otherwise use score from existing attempt
        const score = result?.score ?? existingAttempt?.score ?? 0
        const maxScore = result?.maxScore ?? existingAttempt?.maxScore ?? 0
        const percentage = maxScore > 0
            ? Math.round((score / maxScore) * 100)
            : 0
        const passed = percentage >= 70 // 70% pass mark

        return (
            <div className="rounded-lg border p-4 flex flex-col gap-4">
                {/* quiz title */}
                <h3 className="font-semibold">{quiz.title}</h3>

                {/* score summary card */}
                <div className="rounded-lg bg-muted/50 p-6 text-center flex flex-col gap-2">
                    <p className="text-4xl font-bold">
                        {score}/{maxScore}
                    </p>
                    <p className="text-lg font-medium">
                        {percentage}%
                    </p>
                    {/* pass/fail badge */}
                    <span
                        className={`inline-flex mx-auto items-center rounded-full px-3 py-1 text-sm font-medium ${passed
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                    >
                        {passed ? "Passed" : "Not passed"}
                    </span>
                </div>

                {/* per-question results — only available after fresh submission */}
                {/* existingAttempt doesn't store correctAnswerId so we only show */}
                {/* detailed breakdown for fresh submissions */}
                {result && (
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-medium">Review</h4>
                        {quiz.questions.map((question, qi) => {
                            // find this question's result
                            const qResult = result.results.find(
                                (r) => r.questionId === question._id
                            )
                            return (
                                <div
                                    key={question._id}
                                    className="rounded-md border p-3 flex flex-col gap-2"
                                >
                                    {/* question text with correct/wrong icon */}
                                    <div className="flex items-start gap-2">
                                        {qResult?.isCorrect ? (
                                            <CheckCircleIcon className="size-4 text-green-500 mt-0.5 shrink-0" />
                                        ) : (
                                            <XCircleIcon className="size-4 text-red-500 mt-0.5 shrink-0" />
                                        )}
                                        <p className="text-sm font-medium">
                                            Q{qi + 1}. {question.content}
                                        </p>
                                    </div>

                                    {/* answer options — highlight chosen and correct */}
                                    <div className="flex flex-col gap-1 pl-6">
                                        {question.answers.map((answer) => {
                                            const wasChosen =
                                                answer._id === qResult?.chosenAnswerId
                                            const isCorrect =
                                                answer._id === qResult?.correctAnswerId

                                            return (
                                                <div
                                                    key={answer._id}
                                                    className={`text-sm px-2 py-1 rounded ${isCorrect
                                                            ? "bg-green-50 text-green-700 font-medium"
                                                            : wasChosen && !isCorrect
                                                                ? "bg-red-50 text-red-700"
                                                                : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {/* show what student chose vs what was correct */}
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

    // --- STATE 2: not yet attempted — show quiz questions ---
    return (
        <div className="rounded-lg border p-4 flex flex-col gap-4">

            {/* quiz header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">{quiz.title}</h3>
                <span className="text-xs text-muted-foreground">
                    {quiz.questions.length} questions · {quiz.totalScore} pts
                </span>
            </div>

            {/* question list */}
            {quiz.questions.map((question, qi) => (
                <div
                    key={question._id}
                    className="flex flex-col gap-2"
                >
                    {/* question text */}
                    <p className="text-sm font-medium">
                        Q{qi + 1}. {question.content}
                        <span className="text-xs text-muted-foreground ml-2">
                            ({question.quesScore} pts)
                        </span>
                    </p>

                    {/* answer options as radio buttons */}
                    {/* isCorrect field exists in data but we don't use it here */}
                    {/* student should not know which is correct before submitting */}
                    <div className="flex flex-col gap-1.5 pl-2">
                        {question.answers.map((answer) => {
                            const isSelected =
                                selectedAnswers[question._id] === answer._id
                            return (
                                <label
                                    key={answer._id}
                                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${isSelected
                                            ? "border-primary bg-primary/5"
                                            : "hover:bg-muted/50"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${question._id}`}
                                        checked={isSelected}
                                        onChange={() =>
                                            // update selectedAnswers map with this choice
                                            setSelectedAnswers((prev: Record<string, Id<"q_answers">>) => ({
                                                ...prev,
                                                [question._id]: answer._id,
                                            }))
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

            {/* progress indicator — how many answered so far */}
            <p className="text-xs text-muted-foreground">
                {Object.keys(selectedAnswers).length}/{quiz.questions.length} answered
            </p>

            {/* submit button */}
            <div className="flex justify-center">
                <Button
                    onClick={handleSubmit}
                    disabled={
                        submitting ||
                        Object.keys(selectedAnswers).length < quiz.questions.length
                    }
                >
                    {submitting ? "Submitting..." : "Submit Quiz"}
                </Button>
            </div>
        </div>
    )
}