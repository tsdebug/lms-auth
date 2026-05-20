"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
    CheckCircleIcon,
    CircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    BookOpenIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { QuizPlayer } from "@/components/quiz/QuizPlayer"


export default function LessonViewerPage() {
    const params = useParams()
    const router = useRouter()
    const courseId = params.courseId as Id<"courses">
    const lessonId = params.lessonId as Id<"lessons">

    // fetch current lesson content
    const lesson = useQuery(api.lessons.queries.getLessonContent, {
        lessonId,
        courseId,
    })

    // fetch full course progress for sidebar
    const progress = useQuery(api.lessons.queries.getCourseProgressForStudent, {
        courseId,
    })

    const quiz = useQuery(api.quizzes.queries.getQuizByLesson, { lessonId })

    const markComplete = useMutation(api.lessons.mutations.markLessonComplete)
    const [marking, setMarking] = useState(false)
    const [showQuiz, setShowQuiz] = useState(false)

    async function handleMarkComplete() {
        setMarking(true)
        try {
            await markComplete({ lessonId })
            toast.success("Lesson marked as complete!")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to mark complete")
        } finally {
            setMarking(false)
        }
    }

    // build flat list of all lessons for prev/next navigation
    const allLessons = progress?.chapters.flatMap((c) => c.lessons) ?? []
    const currentIndex = allLessons.findIndex((l) => l._id === lessonId)
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
    const nextLesson = currentIndex < allLessons.length - 1
        ? allLessons[currentIndex + 1]
        : null

    if (lesson === undefined || progress === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
        )
    }

    if (lesson === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Lesson not found</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex">

            {/* sidebar — course outline with progress */}
            <div className="hidden lg:flex flex-col w-72 border-r shrink-0">
                {/* sidebar header */}
                <div className="p-4 border-b">
                    <button
                        onClick={() => router.push(`/courses/${courseId}`)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
                    >
                        ← Back to course
                    </button>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <BookOpenIcon className="size-4" />
                        <span>Course Progress</span>
                    </div>
                    {/* progress bar */}
                    <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{progress.completedCount}/{progress.totalCount} lessons</span>
                            <span>{progress.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${progress.progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* chapter + lesson list */}
                <div className="flex-1 overflow-y-auto py-2">
                    {progress.chapters.map((chapter, ci) => (
                        <div key={chapter._id}>
                            {/* chapter title */}
                            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {ci + 1}. {chapter.title}
                            </div>
                            {/* lessons */}
                            {chapter.lessons.map((l, li) => (
                                <button
                                    key={l._id}
                                    onClick={() =>
                                        router.push(
                                            `/student/courses/${courseId}/lessons/${l._id}`
                                        )
                                    }
                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${l._id === lessonId
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "hover:bg-muted/50"
                                        }`}
                                >
                                    {/* completion icon */}
                                    {l.isCompleted ? (
                                        <CheckCircleIcon className="size-3.5 text-green-500 shrink-0" />
                                    ) : (
                                        <CircleIcon className="size-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <span className="truncate">
                                        {li + 1}. {l.title}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* main content */}
            <div className="flex-1 flex flex-col">

                {/* top bar */}
                <div className="border-b px-6 py-3 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Chapter {lesson.chapterIndex + 1}: {lesson.chapterTitle}
                    </div>
                    {/* mark complete button */}
                    {lesson.isCompleted ? (
                        <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                            <CheckCircleIcon className="size-4" />
                            Completed
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            onClick={handleMarkComplete}
                            disabled={marking}
                        >
                            {marking ? "Saving..." : "Mark as Complete"}
                        </Button>
                    )}
                </div>

                {/* lesson content */}
                <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
                    <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>

                    {lesson.description ? (
                        <p className="text-muted-foreground leading-relaxed">
                            {lesson.description}
                        </p>
                    ) : (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <BookOpenIcon className="size-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                No content yet. Media files coming soon.
                            </p>
                        </div>
                    )}

                    {/* quiz section */}
                    <div className="mt-8 flex flex-col gap-4">
                        {quiz === null || quiz === undefined ? null : (
                            !showQuiz ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowQuiz(true)}
                                    className="w-fit"
                                >
                                    Take Quiz
                                </Button>
                            ) : (
                                <QuizPlayer lessonId={lessonId} />
                            )
                        )}
                    </div>
                </div>

                {/* prev / next navigation */}
                <div className="border-t px-6 py-4 flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!prevLesson}
                        onClick={() =>
                            prevLesson &&
                            router.push(
                                `/student/courses/${courseId}/lessons/${prevLesson._id}`
                            )
                        }
                    >
                        <ChevronLeftIcon className="size-4 mr-1" />
                        Previous
                    </Button>

                    <span className="text-xs text-muted-foreground">
                        {currentIndex + 1} / {allLessons.length}
                    </span>

                    <Button
                        size="sm"
                        disabled={!nextLesson}
                        onClick={() =>
                            nextLesson &&
                            router.push(
                                `/student/courses/${courseId}/lessons/${nextLesson._id}`
                            )
                        }
                    >
                        Next
                        <ChevronRightIcon className="size-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    )
}