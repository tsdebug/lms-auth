import { v } from "convex/values"
import { query } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { requireCourseRole } from "../lib/authorization"

// getLessonsByChapter — returns all lessons for a chapter
export const getLessonsByChapter = query({
  args: {
    chapterId: v.id("chapters"),
  },

  handler: async (ctx, args) => {
    // Get the chapter to find courseId for role check
    const chapter = await ctx.db.get(args.chapterId)
    if (!chapter) throw new Error("Chapter not found")

    // Auth check
    const authUserId = await getAuthUserId(ctx)
    if (!authUserId) throw new Error("Unauthenticated")

    // Role check — must be instructor on this course
    await requireCourseRole(ctx.db, authUserId, chapter.courseId)

    // Return lessons ordered by index
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("chapterId", (q) => q.eq("chapterId", args.chapterId))
      .collect()

    return lessons.sort((a, b) => a.index - b.index)
  },
})
