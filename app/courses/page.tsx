"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BookOpenIcon, UserIcon } from "lucide-react"

export default function CoursesPage() {
    const router = useRouter()
    const categories = useQuery(api.courses.queries.getCategories)

    // filter state
    const [selectedCategory, setSelectedCategory] =
        useState<Id<"categories"> | undefined>(undefined)
    const [selectedDifficulty, setSelectedDifficulty] = useState<
        "beginner" | "intermediate" | "advanced" | undefined
    >(undefined)

    // fetch courses with active filters
    const courses = useQuery(api.courses.queries.getPublishedCourses, {
        categoryId: selectedCategory,
        difficultyLevel: selectedDifficulty,
    })

    return (
        <div className="min-h-screen bg-background">
            {/* header */}
            <div className="border-b">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold">Browse Courses</h1>
                    <p className="mt-1 text-muted-foreground">
                        Find the right course for you
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* filters */}
                <div className="mb-8 flex flex-wrap items-center gap-3">

                    {/* difficulty filter */}
                    <Select
                        value={selectedDifficulty ?? "all"}
                        onValueChange={(v) =>
                            setSelectedDifficulty(
                                v === "all"
                                    ? undefined
                                    : (v as "beginner" | "intermediate" | "advanced")
                            )
                        }
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All levels</SelectItem>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* category pills */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCategory(undefined)}
                            className={`rounded-full border px-3 py-1 text-sm transition-colors ${selectedCategory === undefined
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "hover:bg-muted"
                                }`}
                        >
                            All
                        </button>
                        {categories?.map((cat) => (
                            <button
                                key={cat._id}
                                onClick={() =>
                                    setSelectedCategory(
                                        selectedCategory === cat._id ? undefined : cat._id
                                    )
                                }
                                className={`rounded-full border px-3 py-1 text-sm transition-colors ${selectedCategory === cat._id
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "hover:bg-muted"
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* loading state */}
                {courses === undefined && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-64 rounded-lg border bg-muted/30 animate-pulse"
                            />
                        ))}
                    </div>
                )}

                {/* empty state */}
                {courses?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <BookOpenIcon className="size-12 text-muted-foreground mb-4" />
                        <h2 className="text-lg font-semibold">No courses found</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Try changing your filters
                        </p>
                    </div>
                )}

                {/* course grid */}
                {courses && courses.length > 0 && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <div
                                key={course._id}
                                onClick={() => router.push(`/courses/${course._id}`)}
                                className="group flex flex-col rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                            >
                                {/* thumbnail */}
                                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                                    {course.thumbnailUrl ? (
                                        <img
                                            src={course.thumbnailUrl}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <BookOpenIcon className="size-12 text-muted-foreground" />
                                    )}
                                </div>

                                {/* content */}
                                <div className="flex flex-col gap-2 p-4 flex-1">
                                    {/* categories */}
                                    {course.categories && course.categories.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {course.categories.map((cat) =>
                                                cat ? (
                                                    <Badge
                                                        key={cat._id}
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {cat.name}
                                                    </Badge>
                                                ) : null
                                            )}
                                        </div>
                                    )}

                                    {/* title */}
                                    <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
                                        {course.title}
                                    </h3>

                                    {/* description */}
                                    {course.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {course.description}
                                        </p>
                                    )}

                                    {/* footer */}
                                    <div className="mt-auto flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <UserIcon className="size-3" />
                                            <span>{course.instructorName}</span>
                                        </div>
                                        {course.difficultyLevel && (
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {course.difficultyLevel}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}