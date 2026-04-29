import { v } from "convex/values"
import { query } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { requireCourseRole } from "../lib/authorization"

// getCourseContent — returns all chapters with their lessons for a course
// used by the course editor page
export const getCourseContent = query({
    // args: courseId
    args: {
        courseId: v.id("courses"),
    },

    // handler:
    handler: async (ctx, args) => {
        // 1. auth check
        const authUserId = await getAuthUserId(ctx)
        if (!authUserId) throw new Error("Unauthenticated")

        // 2. role check — must be instructor on this course
        await requireCourseRole(ctx.db, authUserId, args.courseId)

        const course = await ctx.db.get(args.courseId)
        if (!course) throw new Error("Course not found")

        // 3. get chapters ordered by index
        const chapters = await ctx.db
            .query("chapters")
            .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
            .collect()

        // sort by index since Convex doesn't guarantee order
        chapters.sort((a, b) => a.index - b.index)

        // 4. enrich each chapter with its lessons
        const chaptersWithLessons = await Promise.all(
            chapters.map(async (chapter) => {
                const lessons = await ctx.db
                    .query("lessons")
                    .withIndex("chapterId", (q) => q.eq("chapterId", chapter._id))
                    .collect()

                lessons.sort((a, b) => a.index - b.index)

                // return chapter with lessons as a new object
                return { ...chapter, lessons }
            })
        )
        // 5. return course with chapters+lessons
        return {
            ...course,
            chapters: chaptersWithLessons,
        }
    },
})